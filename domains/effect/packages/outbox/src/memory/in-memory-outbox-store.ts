import { Clock, Duration, Effect, Layer } from "effect";
import {
	type OutboxMessage,
	OutboxStore,
	type OutboxStoreShape,
} from "../outbox-store/outbox-store.ts";

export type OutboxMessageState = "pending" | "delivered" | "parked";

export interface StoredOutboxMessage extends OutboxMessage {
	readonly state: OutboxMessageState;
	readonly availableAt: Date;
	readonly lastError: string | undefined;
}

export interface InMemoryOutboxStore {
	readonly layer: Layer.Layer<OutboxStore>;
	/** Every message ever appended, in order, so a test asserts without running a worker. */
	readonly messages: () => ReadonlyArray<StoredOutboxMessage>;
}

/**
 * The store for tests and single-process tools. It has no transaction to join:
 * an append is kept even when the caller's work fails afterwards. Time comes
 * from the `Clock`, so a `TestClock` drives leases and backoff.
 */
export function inMemoryOutboxStore(): InMemoryOutboxStore {
	const rows: Array<StoredOutboxMessage> = [];
	// The order of rows is the order of appends; a worker takes the oldest first.
	const update = (id: string, patch: Partial<StoredOutboxMessage>) => {
		const index = rows.findIndex((row) => row.id === id);
		const row = rows[index];
		if (row !== undefined && row.state === "pending") {
			rows[index] = { ...row, ...patch };
		}
	};
	const now = Effect.map(Clock.currentTimeMillis, (millis) => new Date(millis));
	const later = (after: Duration.Duration) =>
		Effect.map(
			Clock.currentTimeMillis,
			(millis) => new Date(millis + Duration.toMillis(after)),
		);

	const store: OutboxStoreShape = {
		append: (messages) =>
			Effect.map(now, (createdAt) => {
				for (const message of messages) {
					if (rows.some((row) => row.id === message.id)) continue;
					rows.push({
						...message,
						attempts: 0,
						createdAt,
						state: "pending",
						availableAt: createdAt,
						lastError: undefined,
					});
				}
			}),
		claim: ({ channel, limit, lease }) =>
			Effect.gen(function* () {
				const current = yield* now;
				const leasedUntil = yield* later(lease);
				const due = rows
					.filter(
						(row) =>
							row.channel === channel &&
							row.state === "pending" &&
							row.availableAt <= current,
					)
					.slice(0, limit);
				return due.map((row): OutboxMessage => {
					const attempts = row.attempts + 1;
					update(row.id, { attempts, availableAt: leasedUntil });
					return {
						id: row.id,
						channel: row.channel,
						tag: row.tag,
						payload: row.payload,
						attempts,
						createdAt: row.createdAt,
					};
				});
			}),
		complete: (ids) =>
			Effect.sync(() => {
				for (const id of ids) update(id, { state: "delivered" });
			}),
		retry: (id, { after, error }) =>
			Effect.map(later(after), (availableAt) =>
				update(id, { availableAt, lastError: error }),
			),
		park: (id, { error }) =>
			Effect.sync(() => update(id, { state: "parked", lastError: error })),
		prune: ({ olderThan }) =>
			Effect.map(Clock.currentTimeMillis, (millis) => {
				const cutoff = millis - Duration.toMillis(olderThan);
				const before = rows.length;
				const kept = rows.filter(
					(row) =>
						row.state !== "delivered" || row.createdAt.getTime() >= cutoff,
				);
				rows.splice(0, rows.length, ...kept);
				return before - kept.length;
			}),
	};

	return {
		layer: Layer.succeed(OutboxStore)(store),
		messages: () => [...rows],
	};
}

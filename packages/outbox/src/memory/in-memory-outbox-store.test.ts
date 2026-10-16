import { describe, expect, it } from "bun:test";
import { Duration, Effect } from "effect";
import { TestClock } from "effect/testing";
import { OutboxStore } from "../outbox-store/outbox-store.ts";
import { inMemoryOutboxStore } from "./in-memory-outbox-store.ts";

const lease = Duration.minutes(5);

function message(id: string, channel = "orders") {
	return { id, channel, tag: "OrderPlaced", payload: { id } };
}

function run<A, E>(
	memory: ReturnType<typeof inMemoryOutboxStore>,
	effect: Effect.Effect<A, E, OutboxStore>,
) {
	return Effect.runPromise(
		effect.pipe(
			Effect.provide(memory.layer),
			Effect.provide(TestClock.layer()),
		),
	);
}

describe("inMemoryOutboxStore", () => {
	it("claims the oldest pending messages of one channel, counting the attempt", async () => {
		const memory = inMemoryOutboxStore();
		const claimed = await run(
			memory,
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append([
					message("a"),
					message("b", "invoices"),
					message("c"),
				]);
				return yield* store.claim({ channel: "orders", limit: 1, lease });
			}),
		);
		expect(claimed.map((each) => [each.id, each.attempts])).toEqual([["a", 1]]);
	});

	it("keeps a claimed message from other claims until its lease runs out", async () => {
		const memory = inMemoryOutboxStore();
		const ids = await run(
			memory,
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append([message("a")]);
				yield* store.claim({ channel: "orders", limit: 10, lease });
				const during = yield* store.claim({
					channel: "orders",
					limit: 10,
					lease,
				});
				yield* TestClock.adjust(lease);
				const after = yield* store.claim({
					channel: "orders",
					limit: 10,
					lease,
				});
				return { during, after };
			}),
		);
		expect(ids.during).toEqual([]);
		expect(ids.after.map((each) => each.attempts)).toEqual([2]);
	});

	it("holds a retried message back for its delay and remembers the error", async () => {
		const memory = inMemoryOutboxStore();
		const claims = await run(
			memory,
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append([message("a")]);
				yield* store.claim({ channel: "orders", limit: 10, lease });
				yield* store.retry("a", { after: Duration.seconds(30), error: "503" });
				const early = yield* store.claim({
					channel: "orders",
					limit: 10,
					lease,
				});
				yield* TestClock.adjust("30 seconds");
				const due = yield* store.claim({ channel: "orders", limit: 10, lease });
				return { early: early.length, due: due.length };
			}),
		);
		expect(claims).toEqual({ early: 0, due: 1 });
		expect(memory.messages()[0]?.lastError).toBe("503");
	});

	it("never hands out a delivered or a parked message again", async () => {
		const memory = inMemoryOutboxStore();
		const claimed = await run(
			memory,
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append([message("a"), message("b")]);
				yield* store.claim({ channel: "orders", limit: 10, lease });
				yield* store.complete(["a"]);
				yield* store.park("b", { error: "poison" });
				yield* TestClock.adjust(lease);
				return yield* store.claim({ channel: "orders", limit: 10, lease });
			}),
		);
		expect(claimed).toEqual([]);
		expect(memory.messages().map((each) => each.state)).toEqual([
			"delivered",
			"parked",
		]);
	});

	it("ignores a second append of the same id", async () => {
		const memory = inMemoryOutboxStore();
		await run(
			memory,
			Effect.flatMap(OutboxStore, (store) =>
				store.append([message("a"), message("a")]),
			),
		);
		expect(memory.messages()).toHaveLength(1);
	});

	it("prunes old delivered messages only", async () => {
		const memory = inMemoryOutboxStore();
		const pruned = await run(
			memory,
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append([message("a"), message("b"), message("c")]);
				yield* store.claim({ channel: "orders", limit: 10, lease });
				yield* store.complete(["a"]);
				yield* store.park("b", { error: "poison" });
				yield* TestClock.adjust("2 days");
				return yield* store.prune({ olderThan: Duration.days(1) });
			}),
		);
		expect(pruned).toBe(1);
		expect(memory.messages().map((each) => each.id)).toEqual(["b", "c"]);
	});
});

import { Duration, Effect, Layer } from "effect";
import { SqlClient, type SqlError } from "effect/sql";
import {
	type OutboxMessage,
	OutboxStore,
	type OutboxStoreShape,
} from "../outbox-store/outbox-store.ts";
import { OutboxStoreError } from "../outbox-store/outbox-store-error.ts";

interface ClaimedRow {
	readonly id: string;
	readonly channel: string;
	readonly tag: string;
	readonly payload: unknown;
	readonly attempts: number | string;
	readonly created_at: Date | string;
}

function toMessage(row: ClaimedRow): OutboxMessage {
	return {
		id: row.id,
		channel: row.channel,
		tag: row.tag,
		// Drivers that do not parse jsonb hand it back as text.
		payload:
			typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload,
		attempts: Number(row.attempts),
		createdAt: new Date(row.created_at),
	};
}

function failed(operation: string) {
	return <A>(effect: Effect.Effect<A, SqlError.SqlError>) =>
		Effect.mapError(
			effect,
			(cause) =>
				new OutboxStoreError({
					message: `outbox ${operation}: ${cause.message}`,
					cause,
				}),
		);
}

/**
 * The outbox on any Postgres `SqlClient` from `effect/sql`. Every statement
 * runs on the ambient client, so an `append` inside `sql.withTransaction`
 * commits or rolls back with the change it belongs to.
 *
 * The claim is one `UPDATE … FROM (SELECT … FOR UPDATE SKIP LOCKED)`: two
 * workers claiming at the same instant take disjoint rows, the second skipping
 * what the first has locked rather than waiting on it. Time is the database's
 * `now()`, so instances with drifting clocks agree on what is due.
 */
function make(
	options: { readonly table?: string } = {},
): Effect.Effect<OutboxStoreShape, never, SqlClient.SqlClient> {
	return Effect.map(SqlClient.SqlClient, (client): OutboxStoreShape => {
		// Column names are this package's, whatever the application's client transforms.
		const sql = client.withoutTransforms();
		const table = sql(options.table ?? "outbox");
		const seconds = (duration: Duration.Duration) =>
			Duration.toMillis(duration) / 1000;

		// JSON goes over as one `text` parameter: a driver that types parameters
		// from the statement would otherwise encode a `jsonb` one a second time,
		// and a single parameter keeps a batch of any size to one statement.
		return {
			append: (messages) =>
				messages.length === 0
					? Effect.void
					: sql`
							INSERT INTO ${table} (id, channel, tag, payload)
							SELECT id, channel, tag, payload
							FROM jsonb_to_recordset(${JSON.stringify(messages)}::text::jsonb)
								AS m(id text, channel text, tag text, payload jsonb)
							ON CONFLICT (id) DO NOTHING
						`.pipe(Effect.asVoid, failed("append")),
			claim: ({ channel, limit, lease }) =>
				sql<ClaimedRow>`
					UPDATE ${table} AS o
					SET attempts = o.attempts + 1,
						available_at = now() + make_interval(secs => ${seconds(lease)}::double precision),
						updated_at = now()
					FROM (
						SELECT id FROM ${table}
						WHERE channel = ${channel}
							AND state = 'pending'
							AND available_at <= now()
						ORDER BY available_at, created_at
						LIMIT ${limit}::integer
						FOR UPDATE SKIP LOCKED
					) AS due
					WHERE o.id = due.id
					RETURNING o.id, o.channel, o.tag, o.payload, o.attempts, o.created_at
				`.pipe(
					Effect.map((rows) =>
						rows
							.map(toMessage)
							.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
					),
					failed("claim"),
				),
			// Guarded by state: a worker whose lease ran out cannot reopen what another delivered.
			complete: (ids) =>
				ids.length === 0
					? Effect.void
					: sql`
							UPDATE ${table}
							SET state = 'delivered', last_error = NULL, updated_at = now()
							WHERE state = 'pending'
								AND id IN (SELECT jsonb_array_elements_text(${JSON.stringify(ids)}::text::jsonb))
						`.pipe(Effect.asVoid, failed("complete")),
			retry: (id, { after, error }) =>
				sql`
					UPDATE ${table}
					SET available_at = now() + make_interval(secs => ${seconds(after)}::double precision),
						last_error = ${error},
						updated_at = now()
					WHERE id = ${id} AND state = 'pending'
				`.pipe(Effect.asVoid, failed("retry")),
			park: (id, { error }) =>
				sql`
					UPDATE ${table}
					SET state = 'parked', last_error = ${error}, updated_at = now()
					WHERE id = ${id} AND state = 'pending'
				`.pipe(Effect.asVoid, failed("park")),
			prune: ({ olderThan }) =>
				sql<{ readonly count: number | string }>`
					WITH dropped AS (
						DELETE FROM ${table}
						WHERE state = 'delivered'
							AND created_at < now() - make_interval(secs => ${seconds(olderThan)}::double precision)
						RETURNING 1
					)
					SELECT COUNT(*)::integer AS count FROM dropped
				`.pipe(
					Effect.map(([row]) => Number(row?.count ?? 0)),
					failed("prune"),
				),
		};
	});
}

export const PostgresOutboxStore = {
	make,
	layer: (
		options: { readonly table?: string } = {},
	): Layer.Layer<OutboxStore, never, SqlClient.SqlClient> =>
		Layer.effect(OutboxStore, make(options)),
};

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Duration, Effect, Layer, ManagedRuntime } from "effect";
import { SqlClient } from "effect/sql";
import { deliver } from "../delivery/deliver.ts";
import { EventBus } from "../event-bus/event-bus.ts";
import {
	OrderEvents,
	OrderPlaced,
	orderChannel,
} from "../event-bus/order-events.test-helper.ts";
import { OutboxStore } from "../outbox-store/outbox-store.ts";
import { Subscriber } from "../subscriber/subscriber.ts";
import {
	bunSqlClientLayer,
	outboxMigration,
} from "./bun-sql-client.test-helper.ts";
import { PostgresOutboxStore } from "./postgres-outbox-store.ts";

const databaseUrl = process.env.DATABASE_URL;
const lease = Duration.minutes(5);

describe.skipIf(databaseUrl === undefined)("PostgresOutboxStore", () => {
	// A table of its own per run, created from the shipped migration, so the
	// test proves the file and leaves the database as it found it.
	const table = `outbox_test_${crypto.randomUUID().slice(0, 8)}`;
	const runtime = ManagedRuntime.make(
		EventBus.layer(OrderEvents, orderChannel).pipe(
			Layer.provideMerge(PostgresOutboxStore.layer({ table })),
			Layer.provideMerge(bunSqlClientLayer(databaseUrl ?? "")),
		),
	);
	const run = <A, E>(
		effect: Effect.Effect<
			A,
			E,
			OrderEvents | OutboxStore | SqlClient.SqlClient
		>,
	) => runtime.runPromise(effect);
	const states = () =>
		run(
			Effect.flatMap(
				SqlClient.SqlClient,
				(sql) =>
					sql<{
						readonly id: string;
						readonly state: string;
						readonly attempts: number;
						readonly last_error: string | null;
					}>`SELECT id, state, attempts, last_error FROM ${sql(table)} ORDER BY created_at, id`,
			),
		);
	const reset = () =>
		run(
			Effect.flatMap(
				SqlClient.SqlClient,
				(sql) => sql`DELETE FROM ${sql(table)}`,
			),
		);
	const message = (id: string) => ({
		id,
		channel: "orders",
		tag: "OrderPlaced",
		payload: { _tag: "OrderPlaced", orderId: id, total: 1 },
	});

	beforeAll(async () => {
		await run(
			Effect.flatMap(SqlClient.SqlClient, (sql) =>
				sql.unsafe(outboxMigration.replaceAll(/\boutbox(?=\b|_)/gu, table)),
			),
		);
	});

	afterAll(async () => {
		await run(
			Effect.flatMap(
				SqlClient.SqlClient,
				(sql) => sql`DROP TABLE IF EXISTS ${sql(table)}`,
			),
		);
		await runtime.dispose();
	});

	it("rolls the events back with the transaction they were published in", async () => {
		await reset();
		await run(
			Effect.gen(function* () {
				const sql = yield* SqlClient.SqlClient;
				const bus = yield* OrderEvents;
				yield* bus
					.publish(new OrderPlaced({ orderId: "rolled-back", total: 1 }))
					.pipe(
						Effect.andThen(Effect.fail("the change failed")),
						sql.withTransaction,
						Effect.ignore,
					);
				yield* bus
					.publish(new OrderPlaced({ orderId: "committed", total: 2 }))
					.pipe(sql.withTransaction);
			}),
		);
		const rows = await states();
		expect(rows).toHaveLength(1);
	});

	it("hands two concurrent claims disjoint messages", async () => {
		await reset();
		const [first, second] = await run(
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append(["a", "b", "c", "d"].map(message));
				return yield* Effect.all(
					[
						store.claim({ channel: "orders", limit: 2, lease }),
						store.claim({ channel: "orders", limit: 2, lease }),
					],
					{ concurrency: 2 },
				);
			}),
		);
		const ids = [...(first ?? []), ...(second ?? [])].map((each) => each.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids.sort()).toEqual(["a", "b", "c", "d"]);
		expect(first?.[0]?.attempts).toBe(1);
		expect(first?.[0]?.payload).toEqual(message(first?.[0]?.id ?? "").payload);
	});

	it("completes, retries, parks and prunes", async () => {
		await reset();
		const outcome = await run(
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append(["a", "b", "c"].map(message));
				yield* store.claim({ channel: "orders", limit: 10, lease });
				yield* store.complete(["a"]);
				yield* store.retry("b", { after: Duration.zero, error: "503" });
				yield* store.park("c", { error: "poison" });
				const again = yield* store.claim({
					channel: "orders",
					limit: 10,
					lease,
				});
				const pruned = yield* store.prune({ olderThan: Duration.zero });
				return { again: again.map((each) => each.id), pruned };
			}),
		);
		expect(outcome).toEqual({ again: ["b"], pruned: 1 });
		expect(
			(await states()).map((row) => [row.id, row.state, row.last_error]),
		).toEqual([
			["b", "pending", "503"],
			["c", "parked", "poison"],
		]);
	});

	it("delivers what a bus published", async () => {
		await reset();
		const seen: Array<string> = [];
		const onPlaced = Subscriber.make({
			name: "postgres-on-placed",
			tag: "OrderPlaced",
			run: (event: OrderPlaced) => Effect.sync(() => seen.push(event.orderId)),
		});
		const report = await run(
			Effect.gen(function* () {
				const bus = yield* OrderEvents;
				yield* bus.publish(new OrderPlaced({ orderId: "o-1", total: 5 }));
				return yield* deliver(orderChannel, [onPlaced]);
			}),
		);
		expect(report.delivered).toBe(1);
		expect(seen).toEqual(["o-1"]);
		expect((await states()).map((row) => row.state)).toEqual(["delivered"]);
	});
});

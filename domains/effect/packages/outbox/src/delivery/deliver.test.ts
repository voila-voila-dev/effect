import { describe, expect, it } from "bun:test";
import { DateTime, Duration, Effect, Layer } from "effect";
import { TestClock } from "effect/testing";
import { EventBus } from "../event-bus/event-bus.ts";
import {
	OrderEvents,
	OrderPlaced,
	OrderShipped,
	orderChannel,
} from "../event-bus/order-events.test-helper.ts";
import { inMemoryOutboxStore } from "../memory/in-memory-outbox-store.ts";
import { OutboxStore } from "../outbox-store/outbox-store.ts";
import { Subscriber } from "../subscriber/subscriber.ts";
import { deliver } from "./deliver.ts";

const placed = new OrderPlaced({ orderId: "o-1", total: 10 });
const shipped = new OrderShipped({
	orderId: "o-1",
	shippedAt: DateTime.makeUnsafe("2026-01-01T00:00:00.000Z"),
});

function setup() {
	const memory = inMemoryOutboxStore();
	const layer = Layer.mergeAll(
		EventBus.layer(OrderEvents, orderChannel),
		Layer.empty,
	).pipe(
		Layer.provideMerge(memory.layer),
		Layer.provideMerge(TestClock.layer()),
	);
	const run = <A, E>(
		effect: Effect.Effect<
			A,
			E,
			OrderEvents | OutboxStore | TestClock.TestClock
		>,
	) => Effect.runPromise(Effect.provide(effect, layer));
	return { memory, run };
}

const publish = (...events: ReadonlyArray<OrderPlaced | OrderShipped>) =>
	Effect.flatMap(OrderEvents, (bus) => bus.publish(...events));

describe("deliver", () => {
	it("runs the subscribers of each event's tag and settles every message", async () => {
		const { memory, run } = setup();
		const seen: Array<string> = [];
		const onPlaced = Subscriber.make({
			name: "deliver-on-placed",
			tag: "OrderPlaced",
			run: (event: OrderPlaced) =>
				Effect.sync(() => seen.push(`placed ${event.total}`)),
		});
		const onAny = Subscriber.make({
			name: "deliver-on-any",
			tag: ["OrderPlaced", "OrderShipped"],
			run: (event: OrderPlaced | OrderShipped) =>
				Effect.sync(() => seen.push(`any ${event._tag}`)),
		});

		const report = await run(
			Effect.andThen(
				publish(placed, shipped),
				deliver(orderChannel, [onPlaced, onAny]),
			),
		);

		expect(report).toEqual({ claimed: 2, delivered: 2, retried: 0, parked: 0 });
		expect(seen).toEqual(["placed 10", "any OrderPlaced", "any OrderShipped"]);
		expect(memory.messages().map((message) => message.state)).toEqual([
			"delivered",
			"delivered",
		]);
	});

	it("settles an event nobody subscribes to", async () => {
		const { run } = setup();
		const report = await run(
			Effect.andThen(publish(shipped), deliver(orderChannel, [])),
		);
		expect(report.delivered).toBe(1);
	});

	it("retries a failed message with backoff, then parks it after maxAttempts", async () => {
		const { memory, run } = setup();
		const attempts: Array<number> = [];
		const broken = Subscriber.make({
			name: "deliver-broken",
			tag: "OrderPlaced",
			run: (_: OrderPlaced, metadata) =>
				Effect.andThen(
					Effect.sync(() => attempts.push(metadata.attempts)),
					Effect.fail("provider down"),
				),
		});
		const pass = deliver(orderChannel, [broken], {
			maxAttempts: 3,
			backoff: () => Duration.seconds(10),
		});

		const reports = await run(
			Effect.gen(function* () {
				yield* publish(placed);
				const first = yield* pass;
				const tooEarly = yield* pass;
				yield* TestClock.adjust("10 seconds");
				const second = yield* pass;
				yield* TestClock.adjust("10 seconds");
				const third = yield* pass;
				return { first, tooEarly, second, third };
			}),
		);

		expect(reports.first.retried).toBe(1);
		expect(reports.tooEarly.claimed).toBe(0);
		expect(reports.second.retried).toBe(1);
		expect(reports.third.parked).toBe(1);
		expect(attempts).toEqual([1, 2, 3]);
		const [message] = memory.messages();
		expect(message?.state).toBe("parked");
		expect(message?.lastError).toContain("provider down");
	});

	it("runs every sibling before failing the message", async () => {
		const { run } = setup();
		const ran: Array<string> = [];
		const first = Subscriber.make({
			name: "deliver-sibling-broken",
			tag: "OrderPlaced",
			run: (_: OrderPlaced) => Effect.fail("boom"),
		});
		const second = Subscriber.make({
			name: "deliver-sibling-ok",
			tag: "OrderPlaced",
			run: (_: OrderPlaced) => Effect.sync(() => ran.push("second")),
		});
		const report = await run(
			Effect.andThen(publish(placed), deliver(orderChannel, [first, second])),
		);
		expect(report.retried).toBe(1);
		expect(ran).toEqual(["second"]);
	});

	it("parks a message that no longer decodes without running anyone", async () => {
		const { memory, run } = setup();
		const ran: Array<string> = [];
		const onPlaced = Subscriber.make({
			name: "deliver-poison",
			tag: "OrderPlaced",
			run: (_: OrderPlaced) => Effect.sync(() => ran.push("ran")),
		});
		const report = await run(
			Effect.gen(function* () {
				const store = yield* OutboxStore;
				yield* store.append([
					{
						id: "poison",
						channel: "orders",
						tag: "OrderPlaced",
						payload: { _tag: "OrderPlaced", orderId: 7 },
					},
				]);
				return yield* deliver(orderChannel, [onPlaced]);
			}),
		);
		expect(report.parked).toBe(1);
		expect(ran).toEqual([]);
		expect(memory.messages()[0]?.lastError).toContain("does not decode");
	});

	it("refuses two subscribers sharing a name, naming it", () => {
		const twice = Subscriber.make({
			name: "deliver-twice",
			tag: "OrderPlaced",
			run: (_: OrderPlaced) => Effect.void,
		});
		expect(() => deliver(orderChannel, [twice, twice])).toThrow(
			/deliver-twice/u,
		);
	});
});

import { describe, expect, it } from "bun:test";
import { Effect, Fiber, Layer } from "effect";
import { TestClock } from "effect/testing";
import { EventBus } from "../event-bus/event-bus.ts";
import {
	OrderEvents,
	OrderPlaced,
	orderChannel,
} from "../event-bus/order-events.test-helper.ts";
import { inMemoryOutboxStore } from "../memory/in-memory-outbox-store.ts";
import { OutboxStore } from "../outbox-store/outbox-store.ts";
import { OutboxStoreError } from "../outbox-store/outbox-store-error.ts";
import { Subscriber } from "../subscriber/subscriber.ts";
import { outboxWorker } from "./outbox-worker.ts";

function collector(name: string, seen: Array<number>) {
	return Subscriber.make({
		name,
		tag: "OrderPlaced",
		run: (event: OrderPlaced) => Effect.sync(() => seen.push(event.total)),
	});
}

describe("outboxWorker", () => {
	it("delivers what is published while it runs, polling between passes", async () => {
		const memory = inMemoryOutboxStore();
		const seen: Array<number> = [];
		await Effect.gen(function* () {
			const bus = yield* OrderEvents;
			const worker = yield* Effect.forkChild(
				outboxWorker(orderChannel, [collector("worker-collects", seen)], {
					pollInterval: "1 second",
				}),
			);
			yield* bus.publish(new OrderPlaced({ orderId: "o-1", total: 1 }));
			yield* TestClock.adjust("1 second");
			yield* bus.publish(new OrderPlaced({ orderId: "o-2", total: 2 }));
			yield* TestClock.adjust("1 second");
			yield* Fiber.interrupt(worker);
		}).pipe(
			Effect.provide(
				EventBus.layer(OrderEvents, orderChannel).pipe(
					Layer.provideMerge(memory.layer),
					Layer.provideMerge(TestClock.layer()),
				),
			),
			Effect.runPromise,
		);
		expect(seen).toEqual([1, 2]);
	});

	it("outlives a store outage", async () => {
		const memory = inMemoryOutboxStore();
		const seen: Array<number> = [];
		let outage = true;
		const flaky = Layer.effect(
			OutboxStore,
			Effect.map(OutboxStore, (store) => ({
				...store,
				claim: (options: Parameters<typeof store.claim>[0]) =>
					outage
						? Effect.fail(new OutboxStoreError({ message: "down" }))
						: store.claim(options),
			})),
		).pipe(Layer.provide(memory.layer));

		await Effect.gen(function* () {
			const store = yield* OutboxStore;
			const bus = yield* EventBus.make(orderChannel);
			yield* bus.publish(new OrderPlaced({ orderId: "o-3", total: 3 }));
			const worker = yield* Effect.forkChild(
				outboxWorker(orderChannel, [collector("worker-outage", seen)]),
			);
			yield* TestClock.adjust("1 second");
			outage = false;
			yield* TestClock.adjust("1 second");
			yield* Fiber.interrupt(worker);
			return store;
		}).pipe(
			Effect.provide(Layer.merge(flaky, TestClock.layer())),
			Effect.runPromise,
		);
		expect(seen).toEqual([3]);
	});
});

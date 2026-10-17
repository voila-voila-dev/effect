import { describe, expect, it } from "bun:test";
import { DateTime, Effect, Exit, Layer } from "effect";
import { inMemoryOutboxStore } from "../memory/in-memory-outbox-store.ts";
import { MessageIds } from "../message-id/message-ids.ts";
import { OutboxStore } from "../outbox-store/outbox-store.ts";
import { OutboxStoreError } from "../outbox-store/outbox-store-error.ts";
import { EventBus } from "./event-bus.ts";
import { decodeEvent } from "./event-channel.ts";
import {
	OrderEvents,
	OrderPlaced,
	OrderShipped,
	orderChannel,
} from "./order-events.test-helper.ts";

const shippedAt = DateTime.makeUnsafe("2026-01-02T03:04:05.000Z");

describe("EventBus", () => {
	it("appends each event to its channel, encoded as JSON under its tag", async () => {
		const memory = inMemoryOutboxStore();
		await Effect.gen(function* () {
			const bus = yield* OrderEvents;
			yield* bus.publish(
				new OrderPlaced({ orderId: "o-1", total: 42 }),
				new OrderShipped({ orderId: "o-1", shippedAt }),
			);
		}).pipe(
			Effect.provide(
				EventBus.layer(OrderEvents, orderChannel).pipe(
					Layer.provide(memory.layer),
				),
			),
			Effect.runPromise,
		);

		const messages = memory.messages();
		expect(messages.map((message) => [message.channel, message.tag])).toEqual([
			["orders", "OrderPlaced"],
			["orders", "OrderShipped"],
		]);
		expect(messages[1]?.payload).toEqual({
			_tag: "OrderShipped",
			orderId: "o-1",
			shippedAt: "2026-01-02T03:04:05.000Z",
		});
		const decoded = await Effect.runPromise(
			decodeEvent(orderChannel, messages[1]?.payload),
		);
		expect(decoded).toEqual(new OrderShipped({ orderId: "o-1", shippedAt }));
	});

	it("takes each message id from MessageIds", async () => {
		const memory = inMemoryOutboxStore();
		let next = 0;
		await Effect.gen(function* () {
			const bus = yield* EventBus.make(orderChannel);
			yield* bus.publish(
				new OrderPlaced({ orderId: "o-1", total: 1 }),
				new OrderPlaced({ orderId: "o-2", total: 2 }),
			);
		}).pipe(
			Effect.provide(memory.layer),
			Effect.provideService(MessageIds, {
				next: Effect.sync(() => `message-${++next}`),
			}),
			Effect.runPromise,
		);
		expect(memory.messages().map((message) => message.id)).toEqual([
			"message-1",
			"message-2",
		]);
	});

	it("fails the publisher when the store refuses, so the change cannot commit without its events", async () => {
		const down = Layer.succeed(OutboxStore)({
			...Effect.runSync(
				Effect.provide(OutboxStore, inMemoryOutboxStore().layer),
			),
			append: () => Effect.fail(new OutboxStoreError({ message: "down" })),
		});
		const exit = await Effect.gen(function* () {
			const bus = yield* EventBus.make(orderChannel);
			yield* bus.publish(new OrderPlaced({ orderId: "o-2", total: 1 }));
		}).pipe(Effect.provide(down), Effect.exit, Effect.runPromise);

		expect(Exit.isFailure(exit)).toBe(true);
	});
});

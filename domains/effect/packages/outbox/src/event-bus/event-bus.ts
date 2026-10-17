import { type Context, Effect, Layer } from "effect";
import { MessageIds } from "../message-id/message-ids.ts";
import { OutboxStore } from "../outbox-store/outbox-store.ts";
import type { OutboxStoreError } from "../outbox-store/outbox-store-error.ts";
import {
	type EventChannel,
	encodeEvent,
	type Tagged,
} from "./event-channel.ts";

/**
 * Publishing writes to the outbox, nothing more: inside the transaction that
 * makes the change, the events commit or roll back with it, and a worker
 * delivers them afterwards. A failed publish fails the caller, on purpose —
 * dropping it would let the change commit without its events.
 */
export interface EventBus<Event extends Tagged> {
	readonly publish: (
		...events: ReadonlyArray<Event>
	) => Effect.Effect<void, OutboxStoreError>;
}

export const EventBus = {
	make: <Event extends Tagged>(
		channel: EventChannel<Event>,
	): Effect.Effect<EventBus<Event>, never, OutboxStore> =>
		Effect.map(
			OutboxStore,
			(store): EventBus<Event> => ({
				publish: (...events) =>
					Effect.forEach(events, (event) =>
						Effect.all({
							id: Effect.flatMap(MessageIds, (ids) => ids.next),
							payload: encodeEvent(channel, event),
						}).pipe(
							Effect.map(({ id, payload }) => ({
								id,
								channel: channel.name,
								tag: event._tag,
								payload,
							})),
						),
					).pipe(
						Effect.flatMap(store.append),
						Effect.withSpan("event.publish", {
							attributes: {
								"event.channel": channel.name,
								"event.tags": events.map((event) => event._tag).join(","),
							},
						}),
					),
			}),
		),

	/** The application's own bus service, one per channel: `class OrderEvents extends Context.Service<OrderEvents, EventBus<OrderEvent>>()("OrderEvents") {}`. */
	layer: <Self, Event extends Tagged>(
		tag: Context.Service<Self, EventBus<Event>>,
		channel: EventChannel<Event>,
	): Layer.Layer<Self, never, OutboxStore> =>
		Layer.effect(tag, EventBus.make(channel)),
};

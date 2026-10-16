import { Context, Schema } from "effect";
import type { EventBus } from "./event-bus.ts";
import type { EventChannel } from "./event-channel.ts";

export class OrderPlaced extends Schema.TaggedClass<OrderPlaced>()(
	"OrderPlaced",
	{ orderId: Schema.String, total: Schema.Number },
) {}

export class OrderShipped extends Schema.TaggedClass<OrderShipped>()(
	"OrderShipped",
	{ orderId: Schema.String, shippedAt: Schema.DateTimeUtc },
) {}

export const OrderEvent = Schema.Union([OrderPlaced, OrderShipped]);
export type OrderEvent = typeof OrderEvent.Type;

export const orderChannel: EventChannel<OrderEvent> = {
	name: "orders",
	schema: OrderEvent,
};

export class OrderEvents extends Context.Service<
	OrderEvents,
	EventBus<OrderEvent>
>()("test/OrderEvents") {}

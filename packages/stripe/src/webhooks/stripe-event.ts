import { Schema } from "effect";

/**
 * A webhook event's envelope. `data.object` is the object the event is about,
 * read with the field readers; check the signature first, on the raw body,
 * with `verifyStripeSignature` from `@voila.dev/http/webhooks`.
 */
export const StripeEvent = Schema.Struct({
	id: Schema.String,
	/** `payment_intent.succeeded`, `charge.dispute.created`… */
	type: Schema.String,
	/** Seconds since the epoch. */
	created: Schema.Number,
	livemode: Schema.Boolean,
	/** The connected account the event happened on, for Connect events. */
	account: Schema.optional(Schema.String),
	api_version: Schema.optional(Schema.NullOr(Schema.String)),
	data: Schema.Struct({
		object: Schema.Record(Schema.String, Schema.Unknown),
		previous_attributes: Schema.optional(
			Schema.Record(Schema.String, Schema.Unknown),
		),
	}),
});

export type StripeEvent = typeof StripeEvent.Type;

/** A parsed webhook body as a {@link StripeEvent}; none when it is not one. */
export const decodeStripeEvent = Schema.decodeUnknownOption(StripeEvent);

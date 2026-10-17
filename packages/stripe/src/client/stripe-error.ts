import { Schema } from "effect";

/**
 * A call to Stripe failed: no answer, an unreadable one, or an error object.
 * `status` is null when Stripe never answered. `type`, `code` and
 * `declineCode` are Stripe's own, when it sent an error object.
 */
export class StripeError extends Schema.TaggedError<StripeError>()(
	"StripeError",
	{
		message: Schema.String,
		status: Schema.NullOr(Schema.Int),
		/** `invalid_request_error`, `card_error`, `idempotency_error`, `api_error`… */
		type: Schema.NullOr(Schema.String),
		code: Schema.NullOr(Schema.String),
		declineCode: Schema.NullOr(Schema.String),
		/**
		 * Stripe refused the request before acting on it, so nothing exists
		 * there for it: a 4xx other than a 409 (the same idempotency key still
		 * at work) and other than an `idempotency_error` (the key's first use
		 * stands). False whenever the call may have acted — no answer, a 5xx.
		 */
		createdNothing: Schema.Boolean,
	},
) {}

import { Effect, Schema } from "effect";
import type { StripeError } from "./stripe-error.ts";

/**
 * The card's issuer said no. Not a fault of yours or Stripe's: the payer
 * needs to hear which no it was, so it is answered differently from a
 * {@link StripeError} on every axis. `declineCode` is the issuer's reason
 * (`insufficient_funds`, `expired_card`…), else Stripe's `code`, else null.
 */
export class StripeCardDeclinedError extends Schema.TaggedError<StripeCardDeclinedError>()(
	"StripeCardDeclinedError",
	{ declineCode: Schema.NullOr(Schema.String) },
) {}

/**
 * Turns a `card_error` into a {@link StripeCardDeclinedError}, for the calls
 * that charge a card. Applied per call, so a listing that can never be
 * declined does not carry the refusal in its type.
 */
export function rejectDeclinedCards<A, R>(
	effect: Effect.Effect<A, StripeError, R>,
): Effect.Effect<A, StripeError | StripeCardDeclinedError, R> {
	return Effect.catchTag(effect, "StripeError", (error) =>
		Effect.fail(
			error.type === "card_error"
				? new StripeCardDeclinedError({
						declineCode: error.declineCode ?? error.code,
					})
				: error,
		),
	);
}

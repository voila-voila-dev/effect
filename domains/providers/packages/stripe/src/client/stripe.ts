import { Context, type Effect } from "effect";
import type { StripeError } from "./stripe-error.ts";
import type { StripeForm } from "./stripe-form.ts";

export type StripeMethod = "GET" | "POST" | "DELETE";

export interface StripeRequestOptions {
	/** The body of a POST, in Stripe's bracket notation once encoded. */
	readonly form?: StripeForm;
	/** The query string of a GET (`limit`, `expand`, `starting_after`…). */
	readonly query?: StripeForm;
	/** Makes a POST safe to retry, and Stripe answer a retry with the first result. */
	readonly idempotencyKey?: string;
	/** Acts on a connected account (`Stripe-Account`). */
	readonly stripeAccount?: string;
	/** Names the span; by default the method and the path with its ids replaced by `:id`. */
	readonly operation?: string;
}

/** A Stripe object as it arrives: JSON, read with the field readers. */
export type StripeObject = Readonly<Record<string, unknown>>;

/** Stripe's REST API, one call at a time. Paths are relative to `/v1`: `/payment_intents`. */
export class Stripe extends Context.Service<
	Stripe,
	{
		readonly request: (
			method: StripeMethod,
			path: string,
			options?: StripeRequestOptions,
		) => Effect.Effect<StripeObject, StripeError>;
	}
>()("@voila.dev/stripe/Stripe") {}

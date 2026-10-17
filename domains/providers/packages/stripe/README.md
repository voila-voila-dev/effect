# @voila.dev/stripe

Stripe's official SDK is large, typed against the latest API version, and
leaves the hard questions to you: after a failed charge, does a payment intent
exist at Stripe or not? Is a declined card an incident or the payer's bank
saying no? Is this POST safe to retry? This package is a small REST client on
[Effect](https://effect.website) that answers them, and leaves the objects as
the JSON Stripe sends, read with a few typed field readers.

```sh
bun add @voila.dev/stripe @voila.dev/http effect
```

## A call

```ts
import {
	rejectDeclinedCards,
	requireId,
	Stripe,
	stripeFromConfig,
} from "@voila.dev/stripe";
import { Effect } from "effect";

const charge = (orderId: string, amount: number, paymentMethod: string) =>
	Effect.gen(function* () {
		const stripe = yield* Stripe;
		const intent = yield* stripe
			.request("POST", "/payment_intents", {
				form: {
					amount,
					currency: "eur",
					payment_method: paymentMethod,
					confirm: true,
					metadata: { order: orderId },
				},
				idempotencyKey: `charge-${orderId}`,
			})
			.pipe(rejectDeclinedCards);
		return yield* requireId(intent, "POST /payment_intents");
	});

charge("42", 1500, "pm_card_visa").pipe(
	Effect.provide(stripeFromConfig({ apiVersion: "2026-09-30.endive" })), // reads STRIPE_SECRET_KEY
);
```

- **A pinned API version.** Every call sends `Stripe-Version`; the account
  default, which anyone can raise from the dashboard, never applies.
- **Forms in Stripe's notation.** `form` and `query` take nested objects and
  arrays (`metadata[order]`, `expand[0]`); `null` unsets a field.
- **Retries only when safe.** A GET, or a POST with an `idempotencyKey`, is
  retried on a 5xx, a 409, a timeout or a dropped connection, and on a 429
  with a longer backoff. A POST without a key is never retried: it could act
  twice.
- **Errors that say what happened.** A `StripeError` carries the `status`,
  Stripe's `type`, `code` and `declineCode`, and `createdNothing`: true only
  when Stripe refused the request before acting (a 4xx, not a 409, not an
  `idempotency_error`). After anything else, look before you create again.
- **Declines are not incidents.** `rejectDeclinedCards` turns a `card_error`
  into a `StripeCardDeclinedError` with the issuer's reason, on the calls that
  charge — a listing never carries a refusal in its type.
- Each attempt is bounded by 15 seconds and runs in a span named after the
  call with its ids replaced (`outbound.stripe.POST /payment_intents/:id/confirm`).
  With `recordingFetchLayer` from [`@voila.dev/http`](../../../effect/packages/http), every request
  lands in your request log.

## Reading objects

`stringField`, `numberField`, `booleanField` answer an `Option`, so "Stripe
said 0" and "Stripe said nothing" stay apart. `objectField` reads an expanded
object, `objectIdField` an id whether the object was expanded or not,
`listData` the objects of a list, `metadataField` the string metadata.

## Webhooks

Check the signature on the raw body, then decode the envelope:

```ts
import { verifyStripeSignature } from "@voila.dev/http/webhooks";
import { decodeStripeEvent } from "@voila.dev/stripe";

const payload = await request.text();
if (!(await verifyStripeSignature({ payload, header: request.headers.get("stripe-signature") ?? undefined, secret, nowSeconds: Math.floor(Date.now() / 1000) }))) {
	return new Response(null, { status: 400 });
}
const event = decodeStripeEvent(JSON.parse(payload)); // Option<StripeEvent>: id, type, created, data.object…
```

## In tests

```ts
import { scriptedStripe } from "@voila.dev/stripe";

const stripe = scriptedStripe();
stripe.on("POST", "/payment_intents", ({ options }) => ({ id: "pi_test", amount: options.form?.amount }));
program.pipe(Effect.provide(stripe.layer));
stripe.calls; // every request, with its form
```

A call with no scripted answer fails as Stripe's `resource_missing` would.

## License

MIT

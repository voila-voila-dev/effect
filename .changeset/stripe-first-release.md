---
"@voila.dev/stripe": minor
---

First release: a light Stripe REST client on Effect. A pinned `Stripe-Version` on every call, nested form and query encoding, retries only when safe (a GET, or a POST with an idempotency key), `StripeError` with Stripe's type, code, decline code and whether Stripe created nothing, `rejectDeclinedCards` for the calls that charge, typed field readers, the webhook event schema, and a scripted fake.

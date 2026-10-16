# @voila.dev/http

Every third-party adapter ends up rewriting the same things around `fetch`, and
each copy misses a different one: a call with no deadline hangs a request
forever, a retry without jitter turns a blip into an outage, an unbounded
`response.json()` buffers whatever the partner sends, an unchecked shape
becomes an `undefined` three calls later, and when a partner breaks nobody can
say which one, since when, or what it answered.

This package is those pieces once, as small Effect combinators you pipe
together, plus the webhook signature checks the same adapters need.

```sh
bun add @voila.dev/http effect
```

## One call

```ts
import {
	decodeJsonResponse,
	ensureSuccess,
	OutboundTimeout,
	outboundCall,
	RetryPolicy,
	retryOutbound,
	sendOutbound,
	withTimeout,
} from "@voila.dev/http";
import { Effect, Schema } from "effect";

const Customer = Schema.Struct({ id: Schema.String, email: Schema.String });

const retrieveCustomer = (id: string) =>
	sendOutbound("billing", `https://api.billing.test/v1/customers/${id}`, {
		headers: { authorization: `Bearer ${key}` },
	}).pipe(
		Effect.flatMap(ensureSuccess), // non-2xx → OutboundStatusError
		Effect.flatMap(decodeJsonResponse(Customer, { maxBytes: 1_000_000 })),
		withTimeout(OutboundTimeout.roundTrip), // each attempt: 15 s
		retryOutbound(RetryPolicy.transient), // 5xx, 408, network, timeout
		outboundCall({ partner: "billing", operation: "customers.retrieve" }),
	);
```

Every failure is typed: `OutboundTransportError`, `OutboundTimeoutError`,
`OutboundStatusError` (status and the start of the body), `ResponseTooLargeError`,
`ResponseDecodeError`. Interrupting the effect aborts the request.

- **Timeouts** — `withTimeout(duration)`; inside a retry it bounds each attempt,
  outside the whole sequence.
- **Retries** — `retryOutbound(policy, { when })`. `isTransientFailure` by
  default; a 429 wants a longer backoff, so compose a second one:
  `retryOutbound(RetryPolicy.rateLimited, { when: isRateLimited })`. Build your
  own with `retryPolicy({ attempts, initialDelay, maximumDelay })` (exponential,
  capped, jittered). Only retry idempotent calls.
- **Spans** — `outboundCall` names the span `outbound.<partner>.<operation>`,
  logs success at debug and failure at warning.
- **Reading** — `readBoundedBytes`, `decodeJsonResponse` (10 MiB unless told
  otherwise), and `answerField(schema)` for a field a partner may omit or send
  as `null`.

On Effect's own `HttpClient`? `outboundHttpClientLayer(partner)` gives you one
that goes through the same per-partner `fetch`.

## A log of every partner request

`sendOutbound` and `outboundHttpClientLayer` read their `fetch` from
`OutboundFetch`. Provide `recordingFetchLayer` and each request becomes a
`RecordedRequest` — partner, method, host, path without the query string,
status, `succeeded` / `rejected` / `failed`, duration, the partner's request
id, and for a failure the start of its body with emails and numbers masked —
handed to the `RequestRecorder` service:

```ts
import { inMemoryRequestRecorder, recordingFetchLayer } from "@voila.dev/http";
import { Layer } from "effect";

const memory = inMemoryRequestRecorder(); // memory.requests in a test
const Outbound = recordingFetchLayer((partner) => ({
	// A host your users configure may echo their key in its errors.
	readFailureBody: partner !== "user-webhooks",
})).pipe(Layer.provide(memory.layer));
```

In production, implement `RequestRecorder` over your own table: `record` runs
on the request path, so buffer and flush in batches. Recording never changes
what the adapter sees, and a recorder that throws costs a row, never the call.

## Fetching a URL a user gave you

`fetchPublicUrl(url, { timeoutMilliseconds })` and
`fetchPublicImage(url, { timeoutMilliseconds, maxBytes })` refuse loopback,
private, link-local and reserved addresses on the first request and on every
redirect, so "your logo URL" cannot reach cloud metadata or your internal
network. `resolvePublicHttpUrl` and `isPrivateAddress` are the checks alone;
pass `resolveHost` to answer DNS from a table in tests.

## Webhooks

`@voila.dev/http/webhooks` checks signatures over Web Crypto, so the same code
runs in Bun, Node and Workers. Each returns `false` rather than throwing on a
malformed header, an empty secret (an unconfigured environment refuses
everything) or a stale timestamp (five minutes, `toleranceSeconds` to change).

```ts
import { verifyStripeSignature } from "@voila.dev/http/webhooks";

const valid = await verifyStripeSignature({
	payload: await request.text(), // the raw body, before any JSON parsing
	header: request.headers.get("stripe-signature") ?? undefined,
	secret,
	nowSeconds: Math.floor(Date.now() / 1000),
});
```

- `verifyStripeSignature` — `t=…,v1=…`, several `v1` during a rotation.
- `verifySvixSignature` — Resend, Clerk and others; the `whsec_` secret is
  base64-decoded before keying the HMAC.
- `verifyTwilioSignature`, `twilioSignature` — HMAC-SHA1 over the URL and the
  sorted form parameters, with and without the default port.
- `verifySnsSignature` — SignatureVersion 2 only, the certificate URL pinned to
  `sns.<region>.amazonaws.com` before it is fetched; `SnsEnvelope` decodes the
  body, `isSnsUrl` checks a `SubscribeURL` before you confirm it.

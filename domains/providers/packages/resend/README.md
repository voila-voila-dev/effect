# @voila.dev/resend

[Resend](https://resend.com) on [Effect](https://effect.website): an
`EmailSender` for [`@voila.dev/email`](../../../email/packages/email), the receiving API for
inbound mail, and the webhook event schema — each with an in-memory fake.

```sh
bun add @voila.dev/resend @voila.dev/email @voila.dev/http effect
```

## Sending

```ts
import { EmailSender } from "@voila.dev/email";
import { resendEmailSenderFromConfig } from "@voila.dev/resend";

program.pipe(Effect.provide(resendEmailSenderFromConfig)); // reads RESEND_API_KEY
// or resendEmailSenderLayer({ apiKey: Redacted.make(key) })
```

What it takes care of:

- **Rate limits.** Resend allows a few requests per second per team. At most
  5 requests are in flight per sender (`maxConcurrentRequests`), and a 429 is
  retried with a jittered backoff: Resend did not take the message, so a
  retry cannot send it twice.
- **Nothing else is retried.** After a 5xx or a timeout the message may have
  gone out; the `EmailSendError` goes back to you (or your outbox).
- **Batches.** `sendMany` uses the batch endpoint, 100 messages per call. The
  batch endpoint does not take attachments, so a message with some is sent
  on its own; the ids come back in input order either way.
- Each attempt is bounded by 15 seconds and runs in a span
  `outbound.resend.send` / `outbound.resend.send-batch`; with
  `recordingFetchLayer` from [`@voila.dev/http`](../../../effect/packages/http) every request lands
  in your request log.

## Receiving

Resend's `email.received` webhook carries the envelope only. Fetch the body,
the SPF/DKIM/DMARC verdicts and the attachments by the `email_id` it gives:

```ts
import { ResendReceiving, resendReceivingFromConfig } from "@voila.dev/resend";

const read = (emailId: string) =>
	Effect.gen(function* () {
		const receiving = yield* ResendReceiving;
		const email = yield* receiving.getEmail(emailId);
		if (email.dmarc === "Fail") return "refused"; // "Pass" | "Fail" | "Unknown"
		return email.text;
	});
```

`getEmail` answers `text`, `html`, the three verdicts (an absent or
unrecognised one is `Unknown`, never a guess) and the headers with lowercased
names. `getAttachment(emailId, attachmentId)` follows Resend's short-lived
signed URL and reads at most 40 MiB (`maxAttachmentBytes`).

## Webhooks

Check the signature on the raw body first — Resend signs through Svix — then
decode:

```ts
import { verifySvixSignature } from "@voila.dev/http/webhooks";
import { decodeResendWebhookEvent } from "@voila.dev/resend";

const payload = await request.text();
const valid = await verifySvixSignature({
	payload,
	headers: {
		id: request.headers.get("svix-id") ?? undefined,
		timestamp: request.headers.get("svix-timestamp") ?? undefined,
		signature: request.headers.get("svix-signature") ?? undefined,
	},
	secret, // whsec_…
	nowSeconds: Math.floor(Date.now() / 1000),
});
const event = decodeResendWebhookEvent(JSON.parse(payload)); // Option<ResendWebhookEvent>
```

`ResendWebhookEvent` reads `type`, `created_at` and the `data` fields an
application acts on (`email_id`, `message_id`, `to`, `bounce`, `reason`,
`attachments`…). An event kind it does not know still decodes, so you can
ignore it explicitly.

## In tests

`inMemoryEmailSender()` from `@voila.dev/email` stands in for the sender;
`inMemoryResendReceiving()` holds received mail:

```ts
const receiving = inMemoryResendReceiving();
receiving.seedEmail("rcv_1", { text: "Bonjour", html: null, spf: "Pass", dkim: "Pass", dmarc: "Pass", headers: {} });
program.pipe(Effect.provide(receiving.layer));
```

## License

MIT

# @voila.dev/email

The code that sends a sign-in code should not know which provider carries it.
Swapping Resend for SES, sending marketing through one and receipts through
the other, or running the whole app locally with no provider account at all
should be a change at the composition root, not in every feature.

This package is that seam on [Effect](https://effect.website): one
`EmailSender` contract, the message it takes, the error it fails with, and two
senders you need anyway — one in memory for tests, one that prints to the
console for local development. Provider packages implement the contract:
[`@voila.dev/resend`](../resend).

```sh
bun add @voila.dev/email effect
```

## Sending

```ts
import { EmailAddress, EmailSender } from "@voila.dev/email";
import { Effect } from "effect";

const sendCode = (to: EmailAddress, code: string) =>
	Effect.gen(function* () {
		const email = yield* EmailSender;
		return yield* email.send({
			from: "Example <hello@example.com>",
			to: [to],
			subject: `${code} is your sign-in code`,
			text: `Your code: ${code}`,
			html: `<p>Your code: <strong>${code}</strong></p>`,
		});
	}); // Effect<string, EmailSendError, EmailSender> — the provider's message id
```

An `EmailMessage` holds `from`, `to`, and optionally `cc`, `bcc`, `replyTo`,
`html`, `attachments` (raw bytes; the sender encodes them) and `headers`.
`sendMany` hands many messages over in as few calls as the provider allows and
answers their ids in order.

`EmailSendError` means the provider did not take the message. A sender
retries what is safe to retry (a rate limit) and leaves the rest to you —
typically an outbox that tries again later.

## Locally and in tests

```ts
import { consoleEmailSenderLayer, inMemoryEmailSender } from "@voila.dev/email";

// local development: every message is logged, with its text
program.pipe(Effect.provide(consoleEmailSenderLayer));

// tests
const email = inMemoryEmailSender();
email.failingRecipients.add("bounce@example.com"); // refused like a provider would
program.pipe(Effect.provide(email.layer));
email.sent; // [{ id: "email-1", message }, …]
```

## License

MIT

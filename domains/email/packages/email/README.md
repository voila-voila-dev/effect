# @voila.dev/email

Email as a domain on [Effect](https://effect.website), not just a send call.
The code that mails a sign-in code should not know which provider carries it,
should not lose the message when that provider is down, and should not keep
mailing an address that bounced; and a reply to it should land where it
belongs. This package covers all of it, behind
contracts an application implements with its own storage:

- **sending**: one `EmailSender` contract any provider implements
  ([`@voila.dev/resend`](../../../providers/packages/resend)), plus a console
  sender and an in-memory sender.
- **delivery**: every send goes through an outbox and a log. The first attempt
  is inline; a refused one is retried on a curve from 30 seconds to 2 hours,
  8 attempts in all. The provider's webhooks then amend the log: delivered,
  deferred, bounced or complained.
- **suppression**: hard bounces, complaints and repeated soft bounces put the
  address on a list every later send checks, transactional mail included.
  Operators can also block or release an address by hand.
- **inbound**: received mail is stored with its body, headers and SPF, DKIM
  and DMARC verdicts. A reply to a signed reply address goes to the
  application's handler, and auto-replies are refused before anything else.

```sh
bun add @voila.dev/email @voila.dev/effect-ddd effect
```

## Layout

```
src/
  message/       the shared vocabulary: EmailMessage, EmailAddress, EmailSendingStream
  access/        who calls: EmailOperator (with EmailPermissions) and EmailSystem, and the gates
  sending/       services/EmailSender, errors/EmailSendError, adapters/ (console, in-memory)
  suppression/   aggregates/SuppressedAddress, value-objects/, services/SuppressionList,
                 adapters/, use-cases/
  delivery/      aggregates/EmailLog, value-objects/ (status, bounce kind), policies/ (retry
                 curve, drain order), payloads/ (provider event), events/, services/
                 EmailLogRepository, adapters/, use-cases/
  inbound/       aggregates/InboundEmail, value-objects/ (outcome, verdict), policies/
                 (auto-reply guard, attachment allowlist), services/ (fetcher, handler,
                 repository, ReplyAddresses), adapters/ (signed reply addresses,
                 in-memory), use-cases/
```

`delivery` uses `sending` and `suppression`, `inbound` reads the delivery log
to thread replies, and nothing uses `inbound`.
`src/package-structure.test.ts` enforces this.

## Sending

```ts
import { EmailAddress, EmailSystem, SendEmailUseCase } from "@voila.dev/email";

const emailLogId = yield* SendEmailUseCase.execute({
	actor: new EmailSystem({}),
	payload: {
		message: {
			from: "Example <hello@example.com>",
			to: [EmailAddress.make("marie@example.fr")],
			subject: "123456 is your sign-in code",
			text: "Your code: 123456",
		},
		stream: "Transactional",
		dedupeKey: "sign-in:42", // optional: a second ask sends nothing
	},
});
```

The log is written to the outbox first, so a crash leaves it owed rather than
lost. A refused attempt is not the caller's error: the outbox retries it, and
a message that exhausts the attempts shows as `failed` in the log. Run
`ProcessEmailOutboxUseCase` on a schedule (every few minutes) to pick up the
retries and whatever a crashed process was holding. Transactional mail drains
before notifications, and notifications before campaigns.

## Provider events

Translate each provider webhook into an `EmailDeliveryEvent` and record it:

```ts
yield* RecordEmailDeliveryEventUseCase.execute({
	actor: new EmailSystem({}),
	payload: { event }, // { providerMessageId, recipient, outcome, bounceKind, detail, rfcMessageId, occurredAt }
});
```

When providers deliver events out of order, the worst outcome wins: a complaint
stays a complaint. A hard bounce or a complaint suppresses the address, even
when no log matches the event. Three soft bounces in a row, with no delivery
in between, suppress it too. A blocked bounce never does, since the server
refused the sender, not the recipient. Recording the same event twice is
harmless.

## Receiving

Give a message a reply address that routes back to what it concerns:

```ts
const replyTo = yield* ReplyAddresses.pipe(
	Effect.flatMap((addresses) => addresses.mint({ payload: conversationId, expiresAt })),
); // r.<payload>.<expiry>.<tag>@reply.example.com
```

`signedReplyAddresses({ domain })` signs them with the `TokenSigner` of
[`@voila.dev/crypto`](../../../effect/packages/crypto). Nothing is stored when
one is minted, and a guessed or altered address does not verify. Keep the
payload to a short id, about 25 characters at most.

When the provider reports a received message, store it, then route it:

```ts
const inbound = yield* RecordInboundEmailUseCase.execute({ actor, payload }); // fetches body, headers, verdicts
yield* RouteInboundEmailUseCase.execute({ actor, payload: { inbound } });
```

Routing works through these steps, in order:

1. A message already routed is left alone.
2. Machine mail is rejected: an `Auto-Submitted` or list header, a daemon or
   no-reply sender, or a sender on one of `InboundEmailSettings.ownDomains`.
   This check runs before the token, because an auto-reply carries our own
   valid address.
3. The `to` address must verify. If it does not, the reply address of the
   send it quotes in `In-Reply-To` is tried.
4. Your `InboundEmailHandler` gets the payload. It decides what the payload
   means, checks the sender and DMARC, and answers routed, unroutable or
   rejected.

`FetchInboundAttachmentUseCase` hands over a file's bytes only when the
attachment policy allows it: PDF, images or Word, up to 15 MB.

## Operators

The application maps its own roles onto the domain's permissions:

```ts
new EmailOperator({ operatorId: user.id, permissions: ["email.log.read", "email.log.resend"] });
```

| Use case | Gate |
| --- | --- |
| `SendEmailUseCase`, `RecordEmailDeliveryEventUseCase`, `RecordEmailOpenUseCase` | system |
| `ProcessEmailOutboxUseCase` | system, or `email.outbox.process` |
| `GetEmailLogUseCase`, `SearchEmailLogsUseCase` | `email.log.read` |
| `ResendEmailUseCase` | `email.log.resend` |
| `SuppressAddressUseCase`, `ReleaseSuppressedAddressUseCase`, `SearchSuppressedAddressesUseCase` | `email.suppression.manage` |
| `RecordInboundEmailUseCase`, `RouteInboundEmailUseCase`, `FetchInboundAttachmentUseCase` | system |
| `GetInboundEmailUseCase`, `SearchInboundEmailsUseCase` | `email.inbound.read` |

`emailUseCases` lists them all, for a catalogue or an RPC layer.

## Storage

The domain names `EmailLogRepository`, `SuppressionList`,
`InboundEmailRepository` and `InboundEmailFetcher`; the application
implements them on its database. A repository's `claimDuePending` must lease
its rows, so that two drains never take the same log. The in-memory adapters
(`inMemoryEmailLogRepository`, `inMemorySuppressionList`, `inMemoryEmailSender`)
show the expected behaviour and serve tests:

```ts
const sender = inMemoryEmailSender();
sender.failingRecipients.add("bounce@example.com"); // refused like a provider would
program.pipe(
	Effect.provide(Layer.mergeAll(sender.layer, inMemoryEmailLogRepository().layer, inMemorySuppressionList().layer)),
);
```

Ids are UUIDv7s by default. Provide `EmailIds` to pin them in a test.

## Locally

`consoleEmailSenderLayer` logs every message, text included, instead of sending
it. A sign-in code then shows up in the output, with no provider account needed.

## License

MIT

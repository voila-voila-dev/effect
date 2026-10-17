---
"@voila.dev/email": minor
---

An `inbound` subdomain for received mail. `RecordInboundEmailUseCase` stores a message once, with its body, headers and SPF, DKIM and DMARC verdicts fetched through the `InboundEmailFetcher` contract. `RouteInboundEmailUseCase` rejects machine mail first (auto-reply and list headers, daemon senders, the application's own domains), then verifies the reply address and falls back to the send the reply quotes in `In-Reply-To`, and hands the payload to the application's `InboundEmailHandler`. `signedReplyAddresses` mints and verifies reply addresses signed with `@voila.dev/crypto`. `FetchInboundAttachmentUseCase` hands over a file only when the attachment policy allows it. `GetInboundEmailUseCase` and `SearchInboundEmailsUseCase` gate on the new `email.inbound.read` permission. `EmailLogRepository` gains `findByRfcMessageId`.

---
"@voila.dev/email": minor
---

`@voila.dev/email` becomes a domain with three subdomains on a shared vocabulary. Sending is the `EmailSender` contract, as before. Delivery is an outbox and a log: `SendEmailUseCase` writes the message first and attempts it inline, a refused attempt is retried on a curve up to 8 attempts, and `ProcessEmailOutboxUseCase` drains the retries, transactional mail first. `RecordEmailDeliveryEventUseCase` amends the log from provider webhooks, the worst outcome winning. Suppression is a list fed by hard bounces, complaints and repeated soft bounces, which every send checks, with use cases to block, release and search addresses. The use cases gate on the domain's own `EmailOperator` permissions and `EmailSystem`. `EmailLogRepository` and `SuppressionList` are contracts, with in-memory adapters. The existing exports are unchanged.

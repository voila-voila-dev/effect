# @voila.dev/resend

## 0.1.0

### Minor Changes

- 2ec8c99: First release. `@voila.dev/email`: the `EmailSender` contract every mail provider implements, the `EmailMessage` it takes, `EmailSendError`, and an in-memory and a console sender. `@voila.dev/resend`: an `EmailSender` on Resend (5 requests in flight, 429s retried with backoff and nothing else, batches of 100, messages with attachments sent on their own), the receiving API (body, SPF/DKIM/DMARC verdicts, attachments through the signed URL), the webhook event schema, and an in-memory receiving fake.

### Patch Changes

- Updated dependencies [02f1808]
- Updated dependencies [5480693]
- Updated dependencies [2ec8c99]
  - @voila.dev/email@0.1.0

# @voila.dev/crypto

Every backend ends up with the same handful of crypto needs, and each one is
easy to get subtly wrong: a customer's API key stored in clear, an unsubscribe
link anyone can edit to opt someone else out, a session token that a database
dump hands over as is, a six-digit code biased toward low numbers. This package
gives each its one careful implementation, as Effect services you can swap for
a test double.

- **Secret box**: AES-256-GCM, each value bound to the record that stores it.
- **Signed tokens**: declare a token kind (purpose, payload schema, lifetime)
  and issue and verify it, with no token table.
- **Token digest**: store a bearer token by its SHA-256, never in clear.
- **Secure random**: tokens and digit codes from a `SecureRandom` service.

Web Crypto only: the same code in Bun, Node and Workers.

```sh
bun add @voila.dev/crypto effect
```

## Signed tokens

A token kind is a value; an app declares as many as it needs, and they all
share one `TokenSigner`. The purpose is signed with the payload, so a token of
one kind never passes for another.

```ts
import { hmacTokenSigner, SignedToken } from "@voila.dev/crypto";
import { Config, Effect, Schema } from "effect";

const Unsubscribe = SignedToken.make({
	purpose: "newsletter.unsubscribe",
	payload: Schema.Struct({ contactId: Schema.String }),
});

const Download = SignedToken.make({
	purpose: "file.download",
	payload: Schema.Struct({ key: Schema.String }),
	lifetime: "15 minutes",
});

const program = Effect.gen(function* () {
	const token = yield* Unsubscribe.issue({ contactId: "c_123" });
	const { contactId } = yield* Unsubscribe.verify(token);
});

program.pipe(
	Effect.provide(hmacTokenSigner(Config.Redacted("TOKEN_SECRET"))),
);
```

`verify` fails with `InvalidTokenError`, whose `reason` is `malformed`,
`forged` or `expired` (only ever for a genuine token, so offering a fresh link
reveals nothing). `issueUntil(payload, expiresAt)` sets an expiry per token.
The payload is signed, not encrypted: put ids in it, not secrets.

Where length is scarce, such as an email reply address, shorten the tag with
`tagBytes: 8`.

## Secret box

```ts
import { aesGcmSecretBox, SecretBox } from "@voila.dev/crypto";

const sealed = yield* SecretBox.use((box) => box.seal(apiKey, connection.id));
const apiKey = yield* SecretBox.use((box) => box.open(sealed, connection.id));

Effect.provide(aesGcmSecretBox(Config.Redacted("SECRET_BOX_KEY")));
```

The key is 32 random bytes in base64 (`openssl rand -base64 32`). A sealed text
moved onto another record fails to open. In tests, `plainSecretBox` seals
readably (`plainSealed(value, boundTo)` predicts the text);
`unavailableSecretBox` fails every call with `missing-key`, for a deployment
that runs without a key.

## Token digest and secure random

```ts
import {
	randomDigitCode,
	randomToken,
	tokenDigest,
	webCryptoSecureRandom,
} from "@voila.dev/crypto";

const token = yield* randomToken(); // 256 bits, base64url
const digest = yield* tokenDigest(token); // store this, look up by it
const code = yield* randomDigitCode(6); // uniform, leading zeros kept

Effect.provide(webCryptoSecureRandom);
```

`sequentialSecureRandom()` makes every draw predictable in a test.

The byte helpers the rest is built on are exported too: `utf8Bytes`,
`hexFromBytes`, `base64FromBytes`, `base64UrlFromBytes` and their inverses,
and `constantTimeEquals`.

import { type Config, Effect, Layer, Redacted } from "effect";
import { utf8Bytes } from "../bytes/utf8.ts";
import { TokenSigner } from "./token-signer.ts";

/**
 * Below 32 bytes a secret is guessable offline from one captured token: the
 * tag is a cheap HMAC, so a short or human-chosen secret falls to a dictionary.
 */
export const HMAC_SECRET_MIN_BYTES = 32;

/**
 * HMAC-SHA256 through Web Crypto. A string secret is used as its UTF-8 bytes,
 * so a secret generated as text (`openssl rand -base64 48`) works as is.
 */
export function makeHmacTokenSigner(
	secret: string | Uint8Array<ArrayBuffer>,
): Effect.Effect<TokenSigner["Service"]> {
	const bytes = typeof secret === "string" ? utf8Bytes(secret) : secret;
	if (bytes.byteLength < HMAC_SECRET_MIN_BYTES) {
		return Effect.die(
			new RangeError(
				`a token signing secret is at least ${HMAC_SECRET_MIN_BYTES} bytes, not ${bytes.byteLength}`,
			),
		);
	}
	return Effect.map(
		Effect.promise(() =>
			crypto.subtle.importKey(
				"raw",
				bytes,
				{ name: "HMAC", hash: "SHA-256" },
				false,
				["sign"],
			),
		),
		(key) => ({
			sign: (content) =>
				Effect.promise(
					async () =>
						new Uint8Array(
							await crypto.subtle.sign("HMAC", key, utf8Bytes(content)),
						),
				),
		}),
	);
}

/**
 * The signer keyed from configuration. A missing or short secret stops the
 * layer: there is no development fallback, because a fallback key that ships
 * in the code makes every token it signs forgeable wherever it leaks to. A
 * local run sets its own secret (`Config.withDefault` at the call site, if
 * that is the choice).
 */
export function hmacTokenSigner(
	secret: Config.Config<Redacted.Redacted>,
): Layer.Layer<TokenSigner, Config.ConfigError> {
	return Layer.effect(
		TokenSigner,
		Effect.flatMap(secret, (value) =>
			makeHmacTokenSigner(Redacted.value(value)),
		),
	);
}

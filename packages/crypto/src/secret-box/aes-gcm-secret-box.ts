import { type Config, Effect, Layer, Redacted } from "effect";
import { base64FromBytes, bytesFromBase64 } from "../bytes/base64.ts";
import { textFromUtf8, utf8Bytes } from "../bytes/utf8.ts";
import { SecretBox } from "./secret-box.ts";
import { SecretBoxError } from "./secret-box-error.ts";

/** AES-256: the key is 32 bytes. */
export const AES_GCM_KEY_BYTES = 32;
const NONCE_BYTES = 12;
// Bumped with the key or the cipher, so a sealed value always says how to open it.
const FORMAT = "v1";

const unreadable = new SecretBoxError({ reason: "unreadable" });

/**
 * AES-256-GCM through Web Crypto: the sealed text is
 * `v1.<nonce>.<ciphertext>` in standard base64, with a fresh 12-byte nonce per
 * value. `boundTo` is the associated data, so a changed byte, or a text copied
 * onto another record, fails to open.
 *
 * The nonce comes from Web Crypto, not from `SecureRandom`: a predictable
 * source swapped in by a test must never be able to repeat a GCM nonce under a
 * real key.
 */
export function makeAesGcmSecretBox(
	key: Uint8Array<ArrayBuffer>,
): Effect.Effect<SecretBox["Service"]> {
	if (key.byteLength !== AES_GCM_KEY_BYTES) {
		return Effect.die(
			new RangeError(
				`an AES-GCM secret box key is ${AES_GCM_KEY_BYTES} bytes, not ${key.byteLength}`,
			),
		);
	}
	return Effect.map(
		Effect.promise(() =>
			crypto.subtle.importKey("raw", key, "AES-GCM", false, [
				"encrypt",
				"decrypt",
			]),
		),
		(cryptoKey) => ({
			seal: (plaintext, boundTo) =>
				Effect.promise(async () => {
					const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
					const ciphertext = await crypto.subtle.encrypt(
						{ name: "AES-GCM", iv: nonce, additionalData: utf8Bytes(boundTo) },
						cryptoKey,
						utf8Bytes(plaintext),
					);
					return `${FORMAT}.${base64FromBytes(nonce)}.${base64FromBytes(ciphertext)}`;
				}),
			open: (sealed, boundTo) => {
				const [format, nonce, ciphertext, ...rest] = sealed.split(".");
				const nonceBytes = nonce === undefined ? null : bytesFromBase64(nonce);
				const ciphertextBytes =
					ciphertext === undefined ? null : bytesFromBase64(ciphertext);
				if (
					format !== FORMAT ||
					rest.length > 0 ||
					nonceBytes?.byteLength !== NONCE_BYTES ||
					ciphertextBytes === null
				) {
					return Effect.fail(unreadable);
				}
				return Effect.tryPromise({
					try: async () =>
						textFromUtf8(
							new Uint8Array(
								await crypto.subtle.decrypt(
									{
										name: "AES-GCM",
										iv: nonceBytes,
										additionalData: utf8Bytes(boundTo),
									},
									cryptoKey,
									ciphertextBytes,
								),
							),
						),
					catch: () => unreadable,
				});
			},
		}),
	);
}

/**
 * The secret box keyed from configuration: 32 random bytes in base64
 * (`openssl rand -base64 32`). A key of the wrong shape stops the layer, so a
 * misconfigured deployment fails at boot rather than on the first secret.
 */
export function aesGcmSecretBox(
	key: Config.Config<Redacted.Redacted>,
): Layer.Layer<SecretBox, Config.ConfigError> {
	return Layer.effect(
		SecretBox,
		Effect.gen(function* () {
			const bytes = bytesFromBase64(Redacted.value(yield* key));
			if (bytes === null) {
				return yield* Effect.die(
					new TypeError("the AES-GCM secret box key is not base64"),
				);
			}
			return yield* makeAesGcmSecretBox(bytes);
		}),
	);
}

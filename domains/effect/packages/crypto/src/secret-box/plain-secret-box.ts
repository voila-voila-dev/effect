import { Effect, Layer } from "effect";
import { SecretBox } from "./secret-box.ts";
import { SecretBoxError } from "./secret-box-error.ts";

/**
 * What `plainSecretBox` stores for `plaintext`: a test can plant a sealed
 * value in a fixture, or assert on what a use case stored, without a key.
 */
export function plainSealed(plaintext: string, boundTo: string): string {
	return `sealed:${boundTo}:${plaintext}`;
}

/**
 * A secret box for tests: sealing only wraps the value, readably. It still
 * refuses a text bound to another record, so the binding stays tested.
 */
export const plainSecretBox = Layer.succeed(SecretBox, {
	seal: (plaintext, boundTo) => Effect.succeed(plainSealed(plaintext, boundTo)),
	open: (sealed, boundTo) => {
		const prefix = plainSealed("", boundTo);
		return sealed.startsWith(prefix)
			? Effect.succeed(sealed.slice(prefix.length))
			: Effect.fail(new SecretBoxError({ reason: "unreadable" }));
	},
});

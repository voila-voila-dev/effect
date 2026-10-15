import { Effect } from "effect";
import { base64UrlFromBytes } from "../bytes/base64.ts";
import { SecureRandom } from "./secure-random.ts";

/**
 * An unguessable bearer value (a session id, an invitation code, an API key)
 * in base64url, ready for a URL or a cookie. 32 bytes by default: 256 bits,
 * beyond any online or offline guessing. Store its `tokenDigest`, not the
 * token.
 */
export function randomToken(
	byteLength = 32,
): Effect.Effect<string, never, SecureRandom> {
	return SecureRandom.use((random) => random.bytes(byteLength)).pipe(
		Effect.map(base64UrlFromBytes),
	);
}

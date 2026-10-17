import { Effect, Layer } from "effect";
import { SecureRandom } from "./secure-random.ts";

// Web Crypto refuses more than 65 536 bytes per call.
const MAX_BYTES_PER_CALL = 65_536;

/** The operating system's CSPRNG, through Web Crypto: the same in Bun, Node and Workers. */
export const webCryptoSecureRandom = Layer.succeed(SecureRandom, {
	bytes: (length) =>
		Effect.sync(() => {
			const bytes = new Uint8Array(length);
			for (let offset = 0; offset < length; offset += MAX_BYTES_PER_CALL) {
				crypto.getRandomValues(
					bytes.subarray(offset, offset + MAX_BYTES_PER_CALL),
				);
			}
			return bytes;
		}),
});

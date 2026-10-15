import { Effect, Layer } from "effect";
import { SecureRandom } from "./secure-random.ts";

/**
 * A predictable source for tests: each byte is one more than the last, across
 * calls, so two draws differ and a run is reproducible. Each call returns a
 * layer with its own counter, so tests do not see each other's draws.
 */
export function sequentialSecureRandom(start = 0): Layer.Layer<SecureRandom> {
	let next = start;
	return Layer.succeed(SecureRandom, {
		bytes: (length) =>
			Effect.sync(() =>
				Uint8Array.from({ length }, () => {
					const byte = next & 0xff;
					next += 1;
					return byte;
				}),
			),
	});
}

import { Effect } from "effect";
import { SecureRandom } from "./secure-random.ts";

const UINT32_RANGE = 0x1_00_00_00_00;

/**
 * A uniformly drawn code of `length` decimal digits, leading zeros kept (a
 * one-time login code, a phone verification). Its few bits are only safe
 * behind a rate limit and a short expiry.
 *
 * Rejection-sampled: a plain modulo of a 32-bit draw would favour the low
 * codes. Up to 9 digits, the most a 32-bit draw covers.
 */
export function randomDigitCode(
	length: number,
): Effect.Effect<string, never, SecureRandom> {
	if (!Number.isInteger(length) || length < 1 || length > 9) {
		return Effect.die(
			new RangeError(`a digit code has 1 to 9 digits, not ${length}`),
		);
	}
	const range = 10 ** length;
	const limit = Math.floor(UINT32_RANGE / range) * range;
	return SecureRandom.use((random) =>
		Effect.gen(function* () {
			while (true) {
				const draw = new DataView((yield* random.bytes(4)).buffer).getUint32(0);
				if (draw < limit) return String(draw % range).padStart(length, "0");
			}
		}),
	);
}

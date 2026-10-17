import { describe, expect, it } from "bun:test";
import { Effect, Exit, Layer } from "effect";
import { randomDigitCode } from "./random-digit-code.ts";
import { SecureRandom } from "./secure-random.ts";
import { webCryptoSecureRandom } from "./web-crypto-secure-random.ts";

/** Hands out the given 32-bit draws in order. */
function draws(...values: ReadonlyArray<number>) {
	const queue = [...values];
	return Layer.succeed(SecureRandom, {
		bytes: () =>
			Effect.sync(() => {
				const bytes = new Uint8Array(4);
				new DataView(bytes.buffer).setUint32(0, queue.shift() ?? 0);
				return bytes;
			}),
	});
}

describe("randomDigitCode", () => {
	it("keeps the leading zeros", () => {
		expect(
			Effect.runSync(randomDigitCode(6).pipe(Effect.provide(draws(42)))),
		).toBe("000042");
	});

	it("redraws past the last whole range instead of biasing low codes", () => {
		// Draws from 4 294 000 000, the largest multiple of 10^6 below 2^32, would
		// map onto only part of the codes.
		expect(
			Effect.runSync(
				randomDigitCode(6).pipe(Effect.provide(draws(4_294_967_000, 7))),
			),
		).toBe("000007");
	});

	it("draws the requested number of digits", () => {
		const code = Effect.runSync(
			randomDigitCode(9).pipe(Effect.provide(webCryptoSecureRandom)),
		);
		expect(code).toMatch(/^\d{9}$/u);
	});

	it("refuses a length a 32-bit draw cannot cover", () => {
		const exit = Effect.runSyncExit(
			randomDigitCode(10).pipe(Effect.provide(webCryptoSecureRandom)),
		);
		expect(Exit.isFailure(exit)).toBe(true);
	});
});

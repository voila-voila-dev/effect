import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { randomToken } from "./random-token.ts";
import { sequentialSecureRandom } from "./sequential-secure-random.ts";
import { webCryptoSecureRandom } from "./web-crypto-secure-random.ts";

describe("randomToken", () => {
	it("encodes 32 bytes as 43 base64url characters by default", () => {
		const token = Effect.runSync(
			randomToken().pipe(Effect.provide(webCryptoSecureRandom)),
		);
		expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/u);
	});

	it("is predictable under the sequential source", () => {
		const token = Effect.runSync(
			randomToken(3).pipe(Effect.provide(sequentialSecureRandom())),
		);
		expect(token).toBe("AAEC");
	});
});

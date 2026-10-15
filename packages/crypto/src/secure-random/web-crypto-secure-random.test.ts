import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { SecureRandom } from "./secure-random.ts";
import { webCryptoSecureRandom } from "./web-crypto-secure-random.ts";

function draw(length: number) {
	return Effect.runSync(
		SecureRandom.use((random) => random.bytes(length)).pipe(
			Effect.provide(webCryptoSecureRandom),
		),
	);
}

describe("webCryptoSecureRandom", () => {
	it("draws the requested number of bytes", () => {
		expect(draw(0)).toHaveLength(0);
		expect(draw(32)).toHaveLength(32);
	});

	it("draws different bytes each time", () => {
		expect(draw(32)).not.toStrictEqual(draw(32));
	});

	it("fills past the per-call limit of Web Crypto", () => {
		const bytes = draw(70_000);
		expect(bytes).toHaveLength(70_000);
		expect(bytes.subarray(65_536).some((byte) => byte !== 0)).toBe(true);
	});
});

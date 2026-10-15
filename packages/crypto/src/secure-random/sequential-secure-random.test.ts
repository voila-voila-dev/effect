import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { SecureRandom } from "./secure-random.ts";
import { sequentialSecureRandom } from "./sequential-secure-random.ts";

describe("sequentialSecureRandom", () => {
	it("continues the sequence across draws", () => {
		const draws = Effect.runSync(
			Effect.gen(function* () {
				const random = yield* SecureRandom;
				return [yield* random.bytes(2), yield* random.bytes(2)];
			}).pipe(Effect.provide(sequentialSecureRandom(254))),
		);

		expect(draws.map((bytes) => [...bytes])).toStrictEqual([
			[254, 255],
			[0, 1],
		]);
	});
});

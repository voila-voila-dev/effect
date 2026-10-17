import { describe, expect, it } from "bun:test";
import { Effect, Option } from "effect";
import { inMemoryVies } from "./in-memory-vies.ts";

describe("inMemoryVies", () => {
	it("answers valid for a seeded number, invalid otherwise", async () => {
		const vies = inMemoryVies();
		vies.seedValid({ countryCode: "LU", vatNumber: "20260743", name: "ACME" });
		const [seeded, other] = await Effect.runPromise(
			Effect.all([
				vies.service.checkVatNumber({
					countryCode: "LU",
					vatNumber: "20260743",
				}),
				vies.service.checkVatNumber({
					countryCode: "LU",
					vatNumber: "00000000",
				}),
			]),
		);
		expect(seeded.valid).toBe(true);
		expect(seeded.name).toEqual(Option.some("ACME"));
		expect(seeded.address).toEqual(Option.none());
		expect(other.valid).toBe(false);
		expect(vies.checked).toEqual(["LU20260743", "LU00000000"]);
	});

	it("fails a number marked unavailable", async () => {
		const vies = inMemoryVies();
		vies.unavailableNumbers.add("LU20260743");
		const error = await Effect.runPromise(
			Effect.flip(
				vies.service.checkVatNumber({
					countryCode: "LU",
					vatNumber: "20260743",
				}),
			),
		);
		expect(error._tag).toBe("ViesUnavailableError");
	});
});

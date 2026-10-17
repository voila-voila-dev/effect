import { describe, expect, it } from "bun:test";
import { Effect, Option } from "effect";
import { AnnuaireEntreprises } from "../directory/annuaire-entreprises.ts";
import {
	AnnuaireEntreprisesAddress,
	AnnuaireEntreprisesEstablishment,
} from "../directory/annuaire-entreprises-establishment.ts";
import { inMemoryAnnuaireEntreprises } from "./in-memory-annuaire-entreprises.ts";

function establishment(legalName: string, postalCode: string) {
	return new AnnuaireEntreprisesEstablishment({
		siren: "123456789",
		legalName,
		legalForm: "5710",
		isSoleTrader: false,
		identityWithheld: false,
		isActive: true,
		activityCode: "62.01Z",
		representatives: [],
		address: new AnnuaireEntreprisesAddress({
			street: "1 RUE DE LA PAIX",
			postalCode,
			city: "PARIS",
		}),
	});
}

describe("inMemoryAnnuaireEntreprises", () => {
	it("finds what was seeded, and nothing else", async () => {
		const directory = inMemoryAnnuaireEntreprises();
		directory.seed("12345678900011", establishment("ACME SAS", "75002"));
		const [found, missing] = await Effect.runPromise(
			Effect.gen(function* () {
				const service = yield* AnnuaireEntreprises;
				return [
					yield* service.findBySiret("12345678900011"),
					yield* service.findBySiret("98765432100011"),
				] as const;
			}).pipe(Effect.provide(directory.layer)),
		);
		expect(Option.map(found, (record) => record.legalName)).toEqual(
			Option.some("ACME SAS"),
		);
		expect(Option.isNone(missing)).toBe(true);
		expect(directory.lookedUp).toEqual(["12345678900011", "98765432100011"]);
	});

	it("fails a SIRET marked unavailable", async () => {
		const directory = inMemoryAnnuaireEntreprises();
		directory.unavailableSirets.add("12345678900011");
		const error = await Effect.runPromise(
			Effect.flip(directory.service.findBySiret("12345678900011")),
		);
		expect(error._tag).toBe("AnnuaireEntreprisesUnavailableError");
	});

	it("searches by name and postal code", async () => {
		const directory = inMemoryAnnuaireEntreprises();
		directory.seed("12345678900011", establishment("ACME SAS", "75002"));
		directory.seed("12345678900029", establishment("ACME LYON", "69001"));
		const results = await Effect.runPromise(
			directory.service.searchByName({
				query: "acme",
				postalCode: "69001",
				limit: 5,
			}),
		);
		expect(results.map((result) => result.siret)).toEqual(["12345678900029"]);
	});
});

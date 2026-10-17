import { describe, expect, it } from "bun:test";
import { OutboundFetch, retryPolicy } from "@voila.dev/http";
import { Effect, Exit, Option } from "effect";
import { AnnuaireEntreprisesAddress } from "../directory/annuaire-entreprises-establishment.ts";
import {
	type AnsweringFetch,
	answeringFetch,
} from "./answering-fetch.test-helper.ts";
import withheld from "./fixtures/annuaire-entreprises-search-80329862900061.json" with {
	type: "json",
};
import company from "./fixtures/annuaire-entreprises-search-95292208600014.json" with {
	type: "json",
};
import byName from "./fixtures/annuaire-entreprises-search-stade-de-reims.json" with {
	type: "json",
};
import { makeAnnuaireEntreprises } from "./make-annuaire-entreprises.ts";

const directory = makeAnnuaireEntreprises({
	transientRetry: retryPolicy({
		attempts: 2,
		initialDelay: "1 millis",
		maximumDelay: "1 millis",
	}),
	rateLimitedRetry: retryPolicy({
		attempts: 4,
		initialDelay: "1 millis",
		maximumDelay: "1 millis",
	}),
});

function through<A, E>(stub: AnsweringFetch, effect: Effect.Effect<A, E>) {
	return effect.pipe(Effect.provideService(OutboundFetch, () => stub.fetch));
}

function lookUp(stub: AnsweringFetch, siret: string) {
	return Effect.runPromise(through(stub, directory.findBySiret(siret)));
}

async function outcome(stub: AnsweringFetch) {
	const exit = await Effect.runPromiseExit(
		through(stub, directory.findBySiret("95292208600014")),
	);
	return Exit.match(exit, {
		onSuccess: (found) =>
			Option.match(found, {
				onNone: () => "not found",
				onSome: (record) => `found ${record.siren}`,
			}),
		onFailure: (cause) => String(cause),
	});
}

function answering(...statuses: ReadonlyArray<number>) {
	return answeringFetch((attempt) => {
		const status = statuses[Math.min(attempt, statuses.length) - 1] ?? 200;
		return status === 200
			? company
			: Response.json({ erreur: "indisponible" }, { status });
	});
}

describe("findBySiret", () => {
	it("reads the company behind the SIRET, natural persons only", async () => {
		const stub = answeringFetch(() => company);
		const record = Option.getOrThrow(await lookUp(stub, "95292208600014"));
		expect(stub.urls[0]?.searchParams.get("q")).toBe("95292208600014");
		expect(record.siren).toBe("952922086");
		expect(record.legalName).toBe(
			"KINE LYON NORD SELARLU DE MASSEURS-KINESITHERAPEUTES",
		);
		expect(record.legalForm).toBe("5485");
		expect(record.isSoleTrader).toBe(false);
		expect(record.identityWithheld).toBe(false);
		// Active even though its former head office is closed.
		expect(record.isActive).toBe(true);
		expect(record.activityCode).toBe("86.90E");
		expect(record.representatives.map((person) => ({ ...person }))).toEqual([
			{
				lastName: "DUPONT",
				firstNames: "CAMILLE ANDRÉE",
				role: "Gérant",
				birthMonth: "1980-01",
			},
		]);
	});

	it("reads a sole trader's own name as the legal name", async () => {
		const stub = answeringFetch(() => ({
			results: [
				{
					siren: "798933420",
					nom_complet: "CAMILLE MARTIN",
					nom_raison_sociale: null,
					statut_diffusion: "O",
					nature_juridique: "1000",
					etat_administratif: "A",
					activite_principale: "86.90D",
					dirigeants: [
						{
							type_dirigeant: "personne physique",
							nom: "MARTIN",
							prenoms: "CAMILLE",
							qualite: null,
							date_de_naissance: null,
						},
						{
							type_dirigeant: "personne morale",
							siren: "000000000",
							denomination: "HOLDING",
							qualite: "Associé",
						},
					],
					siege: { siret: "79893342000012" },
					matching_etablissements: [{ siret: "79893342000012" }],
				},
			],
		}));
		const record = Option.getOrThrow(await lookUp(stub, "79893342000012"));
		expect(record.address).toBeNull();
		expect(record.legalName).toBe("CAMILLE MARTIN");
		expect(record.isSoleTrader).toBe(true);
		expect(record.identityWithheld).toBe(false);
		expect(record.representatives).toHaveLength(1);
	});

	it("flags a sole trader who opted out of INSEE diffusion and drops the masked director", async () => {
		const stub = answeringFetch(() => withheld);
		const record = Option.getOrThrow(await lookUp(stub, "80329862900061"));
		expect(record.siren).toBe("803298629");
		expect(record.legalName).toBe("[NON-DIFFUSIBLE]");
		expect(record.isSoleTrader).toBe(true);
		expect(record.identityWithheld).toBe(true);
		expect(record.isActive).toBe(true);
		expect(record.representatives).toHaveLength(0);
	});

	it("reads the establishment's address off its one-line form", async () => {
		const place = {
			siret: "65288051900036",
			adresse: "57 BOULEVARD DEMORIEUX 72100 LE MANS",
			code_postal: "72100",
			libelle_commune: "LE MANS",
		};
		const stub = answeringFetch(() => ({
			results: [
				{
					siren: "652880519",
					nom_complet: "BSN-RADIANTE SAS",
					nom_raison_sociale: "BSN-RADIANTE SAS",
					statut_diffusion: "O",
					nature_juridique: "5710",
					etat_administratif: "A",
					activite_principale: "46.46Z",
					dirigeants: [],
					siege: place,
					matching_etablissements: [place],
				},
			],
		}));
		const found = await lookUp(stub, "65288051900036");
		expect(Option.map(found, (record) => record.address)).toStrictEqual(
			Option.some(
				new AnnuaireEntreprisesAddress({
					street: "57 BOULEVARD DEMORIEUX",
					postalCode: "72100",
					city: "LE MANS",
				}),
			),
		);
	});

	it("answers none when no company holds the SIRET", async () => {
		expect(
			Option.isNone(
				await lookUp(
					answeringFetch(() => company),
					"95292208600022",
				),
			),
		).toBe(true);
		expect(
			Option.isNone(
				await lookUp(
					answeringFetch(() => ({ results: [] })),
					"95292208600014",
				),
			),
		).toBe(true);
	});

	it("goes out as the partner it is given", async () => {
		const asked: Array<string> = [];
		const stub = answeringFetch(() => company);
		await Effect.runPromise(
			makeAnnuaireEntreprises({ partner: "registry" })
				.findBySiret("95292208600014")
				.pipe(
					Effect.provideService(OutboundFetch, (partner) => {
						asked.push(partner);
						return stub.fetch;
					}),
				),
		);
		expect(asked).toEqual(["registry"]);
	});
});

describe("retries", () => {
	it("settles after a 503", async () => {
		const stub = answering(503, 200);
		expect(await outcome(stub)).toBe("found 952922086");
		expect(stub.urls).toHaveLength(2);
	});

	it("settles after two 429", async () => {
		const stub = answering(429, 429, 200);
		expect(await outcome(stub)).toBe("found 952922086");
		expect(stub.urls).toHaveLength(3);
	});

	it("settles after a dropped connection", async () => {
		const stub = answeringFetch((attempt) => {
			if (attempt === 1) throw new TypeError("fetch failed");
			return company;
		});
		expect(await outcome(stub)).toBe("found 952922086");
		expect(stub.urls).toHaveLength(2);
	});

	it("ends unavailable after five 429", async () => {
		const stub = answering(429);
		const failure = await outcome(stub);
		expect(failure).toContain("AnnuaireEntreprisesUnavailableError");
		expect(failure).toContain("429");
		expect(stub.urls).toHaveLength(5);
	});

	it("ends unavailable after three 503", async () => {
		const stub = answering(503);
		expect(await outcome(stub)).toContain(
			"AnnuaireEntreprisesUnavailableError",
		);
		expect(stub.urls).toHaveLength(3);
	});

	it("does not retry a 400", async () => {
		const stub = answering(400);
		const failure = await outcome(stub);
		expect(failure).toContain("AnnuaireEntreprisesUnavailableError");
		expect(failure).toContain("400");
		expect(stub.urls).toHaveLength(1);
	});

	it("does not retry an answer that does not decode", async () => {
		const stub = answeringFetch(() => ({ results: [{ siren: 42 }] }));
		expect(await outcome(stub)).toContain("did not decode");
		expect(stub.urls).toHaveLength(1);
	});
});

describe("searchByName", () => {
	it("searches active companies by name and postal code, through their head office", async () => {
		const stub = answeringFetch(() => byName);
		const results = await Effect.runPromise(
			through(
				stub,
				directory.searchByName({
					query: "stade de reims",
					postalCode: "51450",
					limit: 3,
				}),
			),
		);
		const url = stub.urls[0];
		expect(url?.searchParams.get("q")).toBe("stade de reims");
		expect(url?.searchParams.get("code_postal")).toBe("51450");
		expect(url?.searchParams.get("etat_administratif")).toBe("A");
		expect(url?.searchParams.get("per_page")).toBe("3");
		expect(
			results.map(({ siret, establishment }) => [
				siret,
				establishment.legalName,
				establishment.legalForm,
			]),
		).toEqual([
			["44116434000032", "SASP STADE DE REIMS", "5599"],
			["39012845200054", "ASSOCIATION STADE DE REIMS", "9220"],
			["21510421700017", "COMMUNE DE REIMS", "7210"],
		]);
		expect(results[1]?.establishment.address).toEqual(
			new AnnuaireEntreprisesAddress({
				street: "53 ROUTE DE LA NEUVILLETTE",
				postalCode: "51450",
				city: "BETHENY",
			}),
		);
	});
});

import { Effect, Layer, Option } from "effect";
import { AnnuaireEntreprises } from "../directory/annuaire-entreprises.ts";
import {
	type AnnuaireEntreprisesEstablishment,
	AnnuaireEntreprisesSearchResult,
} from "../directory/annuaire-entreprises-establishment.ts";
import { AnnuaireEntreprisesUnavailableError } from "../directory/annuaire-entreprises-unavailable-error.ts";

/**
 * A directory held in memory, for tests and local runs. `seed` registers an
 * establishment under its SIRET; a SIRET added to `unavailableSirets` fails
 * the way an outage would. A name search matches active establishments whose
 * legal name contains the query, ignoring case; `lookedUp` lists the SIRETs
 * asked for, in order.
 */
export function inMemoryAnnuaireEntreprises() {
	const establishments = new Map<string, AnnuaireEntreprisesEstablishment>();
	const unavailableSirets = new Set<string>();
	const lookedUp: Array<string> = [];

	const service: typeof AnnuaireEntreprises.Service = {
		findBySiret: (siret) => {
			lookedUp.push(siret);
			if (unavailableSirets.has(siret)) {
				return Effect.fail(
					new AnnuaireEntreprisesUnavailableError({
						message: `Annuaire des Entreprises unavailable for ${siret}`,
					}),
				);
			}
			return Effect.succeed(Option.fromNullishOr(establishments.get(siret)));
		},
		searchByName: ({ query, postalCode, limit }) =>
			Effect.succeed(
				[...establishments]
					.filter(
						([, establishment]) =>
							establishment.isActive &&
							establishment.legalName
								.toLowerCase()
								.includes(query.toLowerCase()) &&
							(postalCode === undefined ||
								establishment.address?.postalCode === postalCode),
					)
					.slice(0, limit)
					.map(
						([siret, establishment]) =>
							new AnnuaireEntreprisesSearchResult({ siret, establishment }),
					),
			),
	};

	return {
		lookedUp,
		unavailableSirets,
		seed: (siret: string, establishment: AnnuaireEntreprisesEstablishment) => {
			establishments.set(siret, establishment);
		},
		service,
		layer: Layer.succeed(AnnuaireEntreprises, service),
	};
}

import { Context, type Effect, type Option } from "effect";
import type {
	AnnuaireEntreprisesEstablishment,
	AnnuaireEntreprisesSearchResult,
} from "./annuaire-entreprises-establishment.ts";
import type { AnnuaireEntreprisesUnavailableError } from "./annuaire-entreprises-unavailable-error.ts";

/**
 * The French company directory (Annuaire des Entreprises): who a SIRET
 * belongs to, and which companies answer to a name.
 */
export class AnnuaireEntreprises extends Context.Service<
	AnnuaireEntreprises,
	{
		/** The establishment and its company; none when no company holds this SIRET. */
		readonly findBySiret: (
			siret: string,
		) => Effect.Effect<
			Option.Option<AnnuaireEntreprisesEstablishment>,
			AnnuaireEntreprisesUnavailableError
		>;
		/** The active companies whose name matches, through their head office, best match first. */
		readonly searchByName: (input: {
			readonly query: string;
			readonly postalCode?: string;
			readonly limit: number;
		}) => Effect.Effect<
			ReadonlyArray<AnnuaireEntreprisesSearchResult>,
			AnnuaireEntreprisesUnavailableError
		>;
	}
>()("@voila.dev/annuaire-entreprises/AnnuaireEntreprises") {}

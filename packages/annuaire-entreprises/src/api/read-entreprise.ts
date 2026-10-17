import { Schema } from "effect";
import {
	AnnuaireEntreprisesAddress,
	AnnuaireEntreprisesEstablishment,
	AnnuaireEntreprisesRepresentative,
	AnnuaireEntreprisesSearchResult,
} from "../directory/annuaire-entreprises-establishment.ts";
import {
	type Entreprise,
	type Etablissement,
	NaturalPersonDirigeant,
} from "./search-response.ts";

/** INSEE `nature_juridique` of an entrepreneur individuel. */
const SOLE_TRADER_LEGAL_FORM = "1000";
export const ACTIVE_STATE = "A";
/** `statut_diffusion` of a company whose owner did not opt out of INSEE diffusion. */
const PUBLIC_DIFFUSION = "O";
/** What the API prints in place of every masked field. */
const WITHHELD_MARKER = "[NON-DIFFUSIBLE]";

const isNaturalPerson = Schema.is(NaturalPersonDirigeant);

/** Queried by SIRET, the API answers companies whose establishments matched: the answer counts only when one of them is the number asked for. */
export function holdsEstablishment(
	entreprise: Entreprise,
	siret: string,
): boolean {
	return (
		entreprise.siege?.siret === siret ||
		entreprise.matching_etablissements.some((place) => place.siret === siret)
	);
}

// A masked director carries the marker in place of a name: keeping them
// would have a name match compare someone against "[NON-DIFFUSIBLE]".
function isNamed(
	person: Entreprise["dirigeants"][number],
): person is NaturalPersonDirigeant & { nom: string } {
	return (
		isNaturalPerson(person) &&
		person.nom !== null &&
		person.nom !== WITHHELD_MARKER &&
		person.prenoms !== WITHHELD_MARKER
	);
}

// The one-line address repeats the postal code and the town at its end; the
// street is what comes before them. A matching establishment carries only
// that line, so the head office's street is read the same way.
function addressOf(
	place: Etablissement | undefined,
): AnnuaireEntreprisesAddress | null {
	const line = place?.adresse?.trim();
	const postalCode = place?.code_postal?.trim();
	const city = place?.libelle_commune?.trim();
	if (!(line && postalCode && city) || line.includes(WITHHELD_MARKER)) {
		return null;
	}
	const suffix = ` ${postalCode} ${city}`;
	const street = line.endsWith(suffix)
		? line.slice(0, -suffix.length).trim()
		: "";
	return street === ""
		? null
		: new AnnuaireEntreprisesAddress({ street, postalCode, city });
}

function etablissementOf(entreprise: Entreprise, siret: string) {
	return entreprise.siege?.siret === siret
		? entreprise.siege
		: entreprise.matching_etablissements.find((place) => place.siret === siret);
}

export function readEstablishment(
	entreprise: Entreprise,
	siret: string,
): AnnuaireEntreprisesEstablishment {
	const legalName = entreprise.nom_raison_sociale ?? entreprise.nom_complet;
	return new AnnuaireEntreprisesEstablishment({
		siren: entreprise.siren,
		legalName,
		legalForm: entreprise.nature_juridique,
		isSoleTrader: entreprise.nature_juridique === SOLE_TRADER_LEGAL_FORM,
		identityWithheld:
			entreprise.statut_diffusion !== PUBLIC_DIFFUSION ||
			legalName === WITHHELD_MARKER,
		isActive: entreprise.etat_administratif === ACTIVE_STATE,
		activityCode: entreprise.activite_principale,
		representatives: entreprise.dirigeants.filter(isNamed).map(
			(person) =>
				new AnnuaireEntreprisesRepresentative({
					lastName: person.nom,
					firstNames: person.prenoms ?? "",
					role: person.qualite,
					birthMonth: person.date_de_naissance,
				}),
		),
		address: addressOf(etablissementOf(entreprise, siret)),
	});
}

/** The company as found by a name search, through its head office; none when the directory gives no head office SIRET. */
export function readHeadOffice(
	entreprise: Entreprise,
): ReadonlyArray<AnnuaireEntreprisesSearchResult> {
	const siret = entreprise.siege?.siret;
	return siret === null || siret === undefined
		? []
		: [
				new AnnuaireEntreprisesSearchResult({
					siret,
					establishment: readEstablishment(entreprise, siret),
				}),
			];
}

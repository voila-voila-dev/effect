import { Schema } from "effect";

// What https://recherche-entreprises.api.gouv.fr/search answers, the fields
// read and no more: the API adds fields often and never breaks old ones.

const NATURAL_PERSON = "personne physique";

export const NaturalPersonDirigeant = Schema.Struct({
	type_dirigeant: Schema.Literal(NATURAL_PERSON),
	nom: Schema.NullOr(Schema.String),
	prenoms: Schema.NullOr(Schema.String),
	qualite: Schema.NullOr(Schema.String),
	date_de_naissance: Schema.NullOr(Schema.String),
});

export type NaturalPersonDirigeant = typeof NaturalPersonDirigeant.Type;

const LegalPersonDirigeant = Schema.Struct({
	type_dirigeant: Schema.String,
});

export const Etablissement = Schema.Struct({
	siret: Schema.NullOr(Schema.String),
	/** The whole address on one line, ending with the postal code and the town. */
	adresse: Schema.optional(Schema.NullOr(Schema.String)),
	code_postal: Schema.optional(Schema.NullOr(Schema.String)),
	libelle_commune: Schema.optional(Schema.NullOr(Schema.String)),
});

export type Etablissement = typeof Etablissement.Type;

export const Entreprise = Schema.Struct({
	siren: Schema.String,
	nom_complet: Schema.String,
	nom_raison_sociale: Schema.NullOr(Schema.String),
	statut_diffusion: Schema.NullOr(Schema.String),
	nature_juridique: Schema.NullOr(Schema.String),
	etat_administratif: Schema.NullOr(Schema.String),
	activite_principale: Schema.NullOr(Schema.String),
	dirigeants: Schema.Array(
		Schema.Union([NaturalPersonDirigeant, LegalPersonDirigeant]),
	),
	siege: Schema.NullOr(Etablissement),
	matching_etablissements: Schema.Array(Etablissement),
});

export type Entreprise = typeof Entreprise.Type;

export const SearchResponse = Schema.Struct({
	results: Schema.Array(Entreprise),
});

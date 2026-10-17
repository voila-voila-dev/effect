import { Effect, Schema } from "effect";

export class AnnuaireEntreprisesRepresentative extends Schema.Class<AnnuaireEntreprisesRepresentative>(
	"AnnuaireEntreprisesRepresentative",
)({
	lastName: Schema.String,
	firstNames: Schema.String,
	role: Schema.NullOr(Schema.String),
	/** `YYYY-MM`, the precision the directory publishes. */
	birthMonth: Schema.NullOr(Schema.String),
}) {}

/** The establishment's address as the directory prints it, French by construction. */
export class AnnuaireEntreprisesAddress extends Schema.Class<AnnuaireEntreprisesAddress>(
	"AnnuaireEntreprisesAddress",
)({
	street: Schema.String,
	postalCode: Schema.String,
	city: Schema.String,
}) {}

/**
 * The establishment a SIRET names, with the company (SIREN level) that owns
 * it, as the Annuaire des Entreprises describes them. `legalForm` is the INSEE
 * `nature_juridique` code.
 */
export class AnnuaireEntreprisesEstablishment extends Schema.Class<AnnuaireEntreprisesEstablishment>(
	"AnnuaireEntreprisesEstablishment",
)({
	siren: Schema.String,
	legalName: Schema.String,
	legalForm: Schema.NullOr(Schema.String),
	/** An entrepreneur individuel (`nature_juridique` 1000): the legal name is the owner's own. */
	isSoleTrader: Schema.Boolean,
	/** The owner opted out of INSEE diffusion: `legalName` is a placeholder and the representatives are masked. */
	identityWithheld: Schema.Boolean,
	isActive: Schema.Boolean,
	/** The NAF code of the main activity (`86.90E`). */
	activityCode: Schema.NullOr(Schema.String),
	/** The natural persons who run the company; masked ones are left out. */
	representatives: Schema.Array(AnnuaireEntreprisesRepresentative),
	/** Null when the directory prints no address (a withheld one among them). */
	address: Schema.NullOr(AnnuaireEntreprisesAddress).pipe(
		Schema.withConstructorDefault(Effect.succeed(null)),
		Schema.withDecodingDefaultTypeKey(Effect.succeed(null)),
	),
}) {}

/** One company a name search found, through its head office. */
export class AnnuaireEntreprisesSearchResult extends Schema.Class<AnnuaireEntreprisesSearchResult>(
	"AnnuaireEntreprisesSearchResult",
)({
	/** The head office's SIRET. */
	siret: Schema.String,
	establishment: AnnuaireEntreprisesEstablishment,
}) {}

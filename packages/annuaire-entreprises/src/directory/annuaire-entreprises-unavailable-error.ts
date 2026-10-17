import { Schema } from "effect";

/**
 * The directory could not answer: down, throttled past the retries, refusing
 * the request, or answering a shape this package does not read. It never
 * means "no such company", which is an empty answer.
 */
export class AnnuaireEntreprisesUnavailableError extends Schema.TaggedError<AnnuaireEntreprisesUnavailableError>()(
	"AnnuaireEntreprisesUnavailableError",
	{ message: Schema.String },
) {}

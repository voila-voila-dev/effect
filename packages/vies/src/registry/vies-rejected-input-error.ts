import { Schema } from "effect";

/**
 * VIES refused the request itself, for instance a number with a space in it
 * (`VOW-ERR-2600`). Retrying the same input fails the same way, unlike
 * {@link ViesUnavailableError}.
 */
export class ViesRejectedInputError extends Schema.TaggedError<ViesRejectedInputError>()(
	"ViesRejectedInputError",
	{ code: Schema.String, message: Schema.String },
) {}

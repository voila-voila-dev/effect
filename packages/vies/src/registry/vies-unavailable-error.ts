import { Schema } from "effect";

/**
 * VIES could not answer: the member state's service is down or rate-limited
 * (`MS_UNAVAILABLE`, `MS_MAX_CONCURRENT_REQ`...), the EU service failed, or
 * the network did. A retry later may succeed, so a caller never reads it as
 * an invalid number.
 */
export class ViesUnavailableError extends Schema.TaggedError<ViesUnavailableError>()(
	"ViesUnavailableError",
	{ message: Schema.String },
) {}

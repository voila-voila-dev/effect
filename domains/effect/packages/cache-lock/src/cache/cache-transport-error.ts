import { Schema } from "effect";

/**
 * The backend could not be reached or answered abnormally. Unlike a miss it
 * says nothing about whether the entry exists, so each caller chooses how to
 * degrade: fall back and log, or fail the request.
 */
export class CacheTransportError extends Schema.TaggedError<CacheTransportError>()(
	"CacheTransportError",
	{ key: Schema.String, reason: Schema.String },
) {}

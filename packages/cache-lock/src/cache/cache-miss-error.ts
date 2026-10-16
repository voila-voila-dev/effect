import { Schema } from "effect";

/**
 * The key has no live entry: never written, evicted, or expired. A miss is the
 * expected outcome of a cold read, so it is a typed failure the caller handles
 * (fall back to the source of truth, or treat the value as absent).
 */
export class CacheMissError extends Schema.TaggedError<CacheMissError>()(
	"CacheMissError",
	{ key: Schema.String },
) {}

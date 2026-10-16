import { Schema } from "effect";

/** The key used up its window. `retryAfterSeconds` is at least 1. */
export class RateLimitedError extends Schema.TaggedError<RateLimitedError>()(
	"RateLimitedError",
	{ key: Schema.String, retryAfterSeconds: Schema.Number },
) {}

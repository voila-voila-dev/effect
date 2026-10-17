import { Schema } from "effect";

/**
 * The counter store could not be reached, so the limiter cannot tell whether
 * the call is within its window. Pick a side with `allowWhenUnavailable` or
 * `denyWhenUnavailable`; the window is carried so a denial can say when to
 * come back.
 */
export class RateLimiterUnavailableError extends Schema.TaggedError<RateLimiterUnavailableError>()(
	"RateLimiterUnavailableError",
	{ key: Schema.String, windowSeconds: Schema.Number, reason: Schema.String },
) {}

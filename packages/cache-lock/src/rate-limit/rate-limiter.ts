import { Context, type Effect } from "effect";
import type { RateLimitedError } from "./rate-limited-error.ts";
import type { RateLimiterUnavailableError } from "./rate-limiter-unavailable-error.ts";

/** At most `limit` calls per `key` in each fixed window of `windowSeconds`. */
export interface RateLimit {
	readonly key: string;
	readonly limit: number;
	readonly windowSeconds: number;
}

/**
 * Counts one call against a fixed window. Like `KeyValueCache`, it does not
 * decide what an unreachable store means: a throttle against spam should let
 * the call through, a cap on password attempts must not, so `consume` fails
 * with `RateLimiterUnavailableError` and the caller composes the policy
 * (`allowWhenUnavailable`, `denyWhenUnavailable`).
 */
export class RateLimiter extends Context.Service<
	RateLimiter,
	{
		readonly consume: (
			rateLimit: RateLimit,
		) => Effect.Effect<void, RateLimitedError | RateLimiterUnavailableError>;
	}
>()("@voila.dev/cache-lock/RateLimiter") {}

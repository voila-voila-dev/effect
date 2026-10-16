import { Effect } from "effect";
import { RateLimitedError } from "./rate-limited-error.ts";
import type { RateLimiterUnavailableError } from "./rate-limiter-unavailable-error.ts";

type Consumed<R> = Effect.Effect<
	void,
	RateLimitedError | RateLimiterUnavailableError,
	R
>;

/**
 * Lets the call through when the store is down, with a warning. For throttles
 * against abuse, where an outage must not lock every user out.
 */
export const allowWhenUnavailable = <R>(
	consumed: Consumed<R>,
): Effect.Effect<void, RateLimitedError, R> =>
	Effect.catchTag(consumed, "RateLimiterUnavailableError", (error) =>
		Effect.logWarning(
			`rate limit store unavailable, allowing ${error.key}: ${error.reason}`,
		),
	);

/**
 * Refuses the call when the store is down, retrying after one window. For
 * limits that are themselves a security control (attempts at a password or a
 * one-time code): lifting them for the length of an outage is what an
 * attacker would want.
 */
export const denyWhenUnavailable = <R>(
	consumed: Consumed<R>,
): Effect.Effect<void, RateLimitedError, R> =>
	Effect.catchTag(consumed, "RateLimiterUnavailableError", (error) =>
		Effect.logWarning(
			`rate limit store unavailable, denying ${error.key}: ${error.reason}`,
		).pipe(
			Effect.andThen(
				Effect.fail(
					new RateLimitedError({
						key: error.key,
						retryAfterSeconds: Math.max(1, error.windowSeconds),
					}),
				),
			),
		),
	);

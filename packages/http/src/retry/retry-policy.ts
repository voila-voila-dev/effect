import { type Duration, Schedule } from "effect";

/** How many extra attempts, and how far apart. */
export interface RetryPolicy {
	readonly attempts: number;
	readonly schedule: Schedule.Schedule<Duration.Duration>;
}

/**
 * An exponential, capped, jittered backoff. Adapters that each invent their
 * own curve make a stalled partner's amplification impossible to reason
 * about, so the shape lives here and a policy only picks its bounds. Jitter is
 * not decoration: without it every fiber that failed on the same blip retries
 * in the same millisecond and reproduces the blip.
 */
export function retryPolicy(options: {
	readonly attempts: number;
	readonly initialDelay: Duration.Input;
	readonly maximumDelay: Duration.Input;
}): RetryPolicy {
	return {
		attempts: options.attempts,
		schedule: Schedule.min([
			Schedule.exponential(options.initialDelay),
			Schedule.spaced(options.maximumDelay),
		]).pipe(Schedule.jittered),
	};
}

export const RetryPolicy = {
	/**
	 * A transient 5xx or a dropped connection: two extra attempts inside a
	 * second, long enough to outlive a blip and short enough that the caller's
	 * own request is still there to receive the answer.
	 */
	transient: retryPolicy({
		attempts: 2,
		initialDelay: "100 millis",
		maximumDelay: "1 second",
	}),
	/**
	 * A 429: backed off long enough to land after the rate-limit window
	 * closes, since retrying inside the same second only feeds the limiter.
	 * Four attempts over roughly ten seconds outlive a burst.
	 */
	rateLimited: retryPolicy({
		attempts: 4,
		initialDelay: "1 second",
		maximumDelay: "5 seconds",
	}),
} as const;

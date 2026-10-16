import { Duration } from "effect";

/** The wait before the next attempt, given how many attempts have failed so far (1 after the first). */
export type Backoff = (attempts: number) => Duration.Duration;

/**
 * `base`, then doubling, up to `max`. The cap matters more than the curve: a
 * message parked after a day of a provider outage is worse than one retried
 * hourly through it.
 */
export function exponentialBackoff(
	options: {
		readonly base?: Duration.Input;
		readonly factor?: number;
		readonly max?: Duration.Input;
	} = {},
): Backoff {
	const base = Duration.toMillis(
		Duration.fromInputUnsafe(options.base ?? "1 second"),
	);
	const max = Duration.toMillis(
		Duration.fromInputUnsafe(options.max ?? "1 hour"),
	);
	const factor = options.factor ?? 2;
	return (attempts) =>
		Duration.millis(Math.min(max, base * factor ** Math.max(0, attempts - 1)));
}

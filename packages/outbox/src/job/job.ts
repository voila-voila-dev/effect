import { unitMetrics } from "@voila.dev/effect-ddd";
import { type Cause, Cron, Duration, Effect, Result } from "effect";

export interface Job<E, R> {
	/** Unique; the span name, the metric tag and the name to run it by hand. */
	readonly name: string;
	/** Cron expression, UTC. */
	readonly every: string;
	readonly cron: Cron.Cron;
	readonly timeout: Duration.Duration;
	/** Resolves to the one-line summary the logs show. */
	readonly run: Effect.Effect<string, E, R>;
}

const DEFAULT_TIMEOUT = "10 minutes" as const satisfies Duration.Input;

export const Job = {
	/**
	 * A tick of scheduled work. Like a subscriber, it should find what is owed
	 * by reading state rather than remembering what it did, so a missed or
	 * doubled tick costs nothing.
	 */
	make: <E, R>(options: {
		readonly name: string;
		readonly every: string;
		readonly timeout?: Duration.Input;
		readonly run: Effect.Effect<string, E, R>;
	}): Job<E | Cause.TimeoutError, R> => {
		// A job is declared once, at module level, so an expression that does
		// not parse is a programming error: fail at import rather than at a tick
		// that never comes.
		const cron = Cron.parse(options.every, "UTC");
		if (Result.isFailure(cron)) {
			throw new Error(
				`job ${options.name}: "${options.every}" is not a cron expression (${cron.failure.message})`,
			);
		}
		const timeout = Duration.fromInputUnsafe(
			options.timeout ?? DEFAULT_TIMEOUT,
		);
		return {
			name: options.name,
			every: options.every,
			cron: cron.success,
			timeout,
			run: options.run.pipe(
				Effect.timeout(timeout),
				unitMetrics("job", options.name).track,
				Effect.annotateLogs({ job: options.name }),
				Effect.withSpan(`job.${options.name}`),
			),
		};
	},
};

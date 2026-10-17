import { Cause, Clock, Cron, Effect } from "effect";
import type { Job } from "./job.ts";

/**
 * One tick: logs the summary, or the failure, and never fails itself, so a
 * broken tick waits for the next one instead of stopping the schedule.
 */
export function runJob<E, R>(job: Job<E, R>): Effect.Effect<void, never, R> {
	return job.run.pipe(
		Effect.flatMap((summary) => Effect.logInfo(summary)),
		Effect.catchCause((cause) =>
			Cause.hasInterruptsOnly(cause)
				? Effect.interrupt
				: Effect.logError("job failed", cause),
		),
		Effect.annotateLogs({ job: job.name }),
	);
}

/**
 * Runs a job on its cron in this process, until interrupted. The next run is
 * computed from the clock, never from the previous run, so a slow tick or a
 * restart replays nothing. With several instances, each runs every tick:
 * keep the jobs idempotent, or schedule them through a single runner (such as
 * `ClusterCron` from `effect/cluster`, fed `job.cron` and `runJob(job)`).
 */
export function scheduleJob<E, R>(
	job: Job<E, R>,
): Effect.Effect<never, never, R> {
	const untilNextTick = Effect.flatMap(Clock.currentTimeMillis, (now) =>
		Effect.sleep(Cron.next(job.cron, now).getTime() - now),
	);
	return Effect.forever(Effect.andThen(untilNextTick, runJob(job)));
}

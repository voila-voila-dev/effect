import { DateTime, Duration } from "effect";
import type { EmailSendingStream } from "../../message/value-objects/email-sending-stream.ts";

/**
 * The outbox's retry curve. A sender already retries the within-seconds
 * transients (a 429, a blip) inside one attempt; this covers what a whole
 * attempt could not absorb, an outage or an expired key, so it starts at half
 * a minute and stretches to hours.
 */
export const MAXIMUM_DELIVERY_ATTEMPTS = 8;

const RETRY_DELAYS: ReadonlyArray<Duration.Duration> = [
	Duration.seconds(30),
	Duration.minutes(2),
	Duration.minutes(5),
	Duration.minutes(15),
	Duration.minutes(30),
	Duration.hours(1),
	Duration.hours(2),
];

/** When a message whose `attemptCount`-th attempt just failed is due again. */
export function nextAttemptAfterFailure(
	now: DateTime.Utc,
	attemptCount: number,
): DateTime.Utc {
	return DateTime.addDuration(
		now,
		RETRY_DELAYS[Math.min(attemptCount, RETRY_DELAYS.length) - 1] ??
			Duration.hours(2),
	);
}

/**
 * Drain order between streams: someone waits on a screen for a transactional
 * message, nobody waits for a campaign, so a campaign backlog never delays a
 * sign-in code.
 */
export const EMAIL_STREAM_DRAIN_PRIORITY: Record<EmailSendingStream, number> = {
	Transactional: 0,
	Notification: 1,
	Marketing: 2,
};

/**
 * How long a claim keeps a row from other drain passes: longer than any
 * healthy attempt, short enough that a crashed instance's rows come back
 * within minutes.
 */
export const EMAIL_CLAIM_LEASE = Duration.minutes(2);

/**
 * Soft bounces in a row, with no delivery in between, after which an address
 * is treated as abandoned rather than busy.
 */
export const SOFT_BOUNCE_SUPPRESSION_THRESHOLD = 3;

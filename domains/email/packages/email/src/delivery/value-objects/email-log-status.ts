import { Schema } from "effect";

/**
 * Where one logged send stands. The first four are facts about our own call,
 * written by the send path; the rest arrive later from the provider's
 * webhooks. `sent` means the provider accepted it, not that it arrived: every
 * rate is taken over `delivered`.
 *
 * - `pending`: in the outbox, owed a delivery attempt.
 * - `sent`: handed to the provider.
 * - `suppressed`: never handed over, a recipient is on the suppression list.
 * - `failed`: the provider refused every attempt the outbox made.
 * - `delivered`: the receiving server accepted it.
 * - `deferred`: refused for now, the provider is still trying. Not a bounce.
 * - `bounced`: refused for good, see {@link BounceKind}.
 * - `complained`: the recipient pressed "this is spam".
 */
export const EMAIL_LOG_STATUSES = [
	"pending",
	"sent",
	"suppressed",
	"failed",
	"delivered",
	"deferred",
	"bounced",
	"complained",
] as const;

export const EmailLogStatus = Schema.Literals(EMAIL_LOG_STATUSES);

export type EmailLogStatus = typeof EmailLogStatus.Type;

/**
 * How bad each outcome is. Providers do not promise ordering, and a
 * `delivered` event can land after the complaint it led to: comparing
 * severity rather than arrival keeps the worst outcome seen.
 */
const STATUS_SEVERITY: Record<EmailLogStatus, number> = {
	// Below every outcome: an event only exists for a message that left.
	pending: -1,
	suppressed: 0,
	failed: 1,
	sent: 2,
	deferred: 3,
	delivered: 4,
	bounced: 5,
	complained: 6,
};

/** True when `candidate` is a worse outcome than `current`, and so wins. */
export function supersedesEmailLogStatus(
	current: EmailLogStatus,
	candidate: EmailLogStatus,
): boolean {
	return STATUS_SEVERITY[candidate] > STATUS_SEVERITY[current];
}

/**
 * The statuses that prove the message reached a mailbox server: the
 * denominator of every engagement rate. A complaint is one, since nobody
 * reports a message they never received.
 */
export const REACHED_MAILBOX_STATUSES: ReadonlyArray<EmailLogStatus> = [
	"delivered",
	"complained",
];

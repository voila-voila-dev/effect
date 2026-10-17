import { DateTime, Effect, Result } from "effect";
import { normalizeEmailAddress } from "../../message/lib/normalize-email-address.ts";
import { EmailSender } from "../../sending/services/email-sender.ts";
import { SuppressionList } from "../../suppression/services/suppression-list.ts";
import type { EmailLog } from "../aggregates/email-log.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";

/** The `failureReason` of a log we chose not to send. */
export const SUPPRESSED_ADDRESS_REASON =
	"a recipient is on the suppression list";

/** What one attempt did to a claimed log. */
export type ClaimedDeliveryOutcome =
	/** The provider took it. */
	| "sent"
	/** Never handed over: a recipient is suppressed. */
	| "suppressed"
	/** Refused; back in the outbox with its next attempt scheduled. */
	| "retryScheduled"
	/** Refused, and the attempts are spent. */
	| "failed";

/** Fail-open: an unreachable list must not stop every mail the application sends. */
function anySuppressed(log: EmailLog) {
	return Effect.flatMap(SuppressionList, (suppressions) =>
		suppressions.areSuppressed(log.recipients.map(normalizeEmailAddress)),
	).pipe(
		Effect.map((found) => found.size > 0),
		Effect.orElseSucceed(() => false),
	);
}

/**
 * One attempt on a claimed pending log, the step both drains share: the
 * enqueuer's inline first attempt and the sweep. Never fails, since every
 * outcome is a state of the log. A suppressed recipient is checked before
 * the provider is called and settles as `suppressed`, not `failed`: nothing
 * went wrong, we chose not to mail.
 */
export function deliverClaimedEmail(
	log: EmailLog,
): Effect.Effect<
	ClaimedDeliveryOutcome,
	never,
	EmailSender | EmailLogRepository | SuppressionList
> {
	return Effect.gen(function* () {
		const sender = yield* EmailSender;
		const repository = yield* EmailLogRepository;

		if (yield* anySuppressed(log)) {
			yield* repository.save(log.settleSuppressed(SUPPRESSED_ADDRESS_REASON));
			return "suppressed";
		}

		const attempt = yield* Effect.result(sender.send(log.message));
		if (Result.isFailure(attempt)) {
			const settled = log.attemptFailed(
				attempt.failure.message,
				yield* DateTime.now,
			);
			yield* repository.save(settled);
			return settled.isPending ? "retryScheduled" : "failed";
		}
		yield* repository.save(log.dispatched(attempt.success));
		return "sent";
	});
}

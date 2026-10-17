import { Effect, Option } from "effect";
import type { EmailSender } from "../../sending/services/email-sender.ts";
import type { SuppressionList } from "../../suppression/services/suppression-list.ts";
import { EmailLog, type EmailLogFacts } from "../aggregates/email-log.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";
import {
	type ClaimedDeliveryOutcome,
	deliverClaimedEmail,
} from "./deliver-claimed-email.ts";

/**
 * Writes a message to the outbox, then makes its first attempt right away.
 * The pending log lands first, and that write is the delivery guarantee: from
 * then on a crash or an outage leaves a log the sweep still owes. The inline
 * attempt is what gets a sign-in code there in seconds rather than on the next
 * sweep; it claims the log by id, so the sweep cannot send it twice.
 */
export function enqueueEmail(
	facts: EmailLogFacts,
): Effect.Effect<
	ClaimedDeliveryOutcome,
	never,
	EmailLogRepository | EmailSender | SuppressionList
> {
	return Effect.gen(function* () {
		const repository = yield* EmailLogRepository;
		yield* repository.save(EmailLog.pending(facts));
		const claimed = yield* repository.claimPendingById(facts.id);
		if (Option.isNone(claimed)) {
			// The sweep holds it: the log is owed either way.
			return "retryScheduled";
		}
		return yield* deliverClaimedEmail(claimed.value);
	});
}

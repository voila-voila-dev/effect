import { Effect } from "effect";
import type { SuppressionReason } from "../../suppression/value-objects/suppression-reason.ts";
import type { EmailDeliveryEvent } from "../payloads/email-delivery-event.ts";
import { SOFT_BOUNCE_SUPPRESSION_THRESHOLD } from "../policies/email-outbox-policy.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";

/** The events that suppress on their own, keyed by outcome and bounce kind. */
const SUPPRESSES_AT_ONCE: Partial<Record<string, SuppressionReason>> = {
	complained: "Complaint",
	"bounced:Hard": "HardBounce",
};

function eventKey(event: EmailDeliveryEvent): string {
	return event.outcome === "bounced"
		? `bounced:${event.bounceKind}`
		: event.outcome;
}

/**
 * Whether a provider event means "never mail this address again", and why. A
 * deferral does not: the provider is still trying. A soft bounce counts once
 * it has repeated past a bad afternoon. A blocked bounce never does: the
 * server refused the sender, not the recipient.
 */
export function suppressionReasonFor(
	event: EmailDeliveryEvent,
): Effect.Effect<SuppressionReason | null, never, EmailLogRepository> {
	const key = eventKey(event);
	const atOnce = SUPPRESSES_AT_ONCE[key];
	if (atOnce !== undefined) return Effect.succeed(atOnce);
	if (key !== "bounced:Soft") return Effect.succeed(null);
	return Effect.map(
		Effect.flatMap(EmailLogRepository, (logs) =>
			logs.countSoftBouncesSinceLastDelivery(event.recipient),
		),
		(run) =>
			run >= SOFT_BOUNCE_SUPPRESSION_THRESHOLD ? "RepeatedSoftBounce" : null,
	);
}

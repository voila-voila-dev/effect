import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Option, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { system } from "../../access/email-gates.ts";
import { normalizeEmailAddress } from "../../message/lib/normalize-email-address.ts";
import { suppress } from "../../suppression/lib/suppress.ts";
import type { SuppressionReason } from "../../suppression/value-objects/suppression-reason.ts";
import { recordDeliveryEvent } from "../lib/record-delivery-event.ts";
import { suppressionReasonFor } from "../lib/suppression-reason-for.ts";
import { EmailDeliveryEvent } from "../payloads/email-delivery-event.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";

/** What one event changed, for a caller with a follow-up (a marketing opt-out on a complaint). */
export interface DeliveryEventOutcome {
	/** False when no log carried the provider's message id. */
	readonly matchedLog: boolean;
	/** Set when the address was suppressed, or its suppression reconfirmed. */
	readonly suppressedFor: SuppressionReason | null;
	/** The normalized address the event was about. */
	readonly email: string;
}

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({ event: EmailDeliveryEvent }),
});

/**
 * Applies one provider event: amends the log, and decides whether the address
 * may be mailed again. The suppression does not depend on finding the log: a
 * bounce for a purged send still suppresses, which is the half with
 * consequences. Safe to replay: the log keeps first timestamps and only
 * worsens, and an existing suppression is reconfirmed, not reopened.
 */
export const RecordEmailDeliveryEventUseCase = UseCase.make({
	name: "delivery.record-email-delivery-event",
	input: Input,
	gate: system<typeof Input.Type>(),
	execute: ({ payload: { event } }) =>
		Effect.gen(function* () {
			const logs = yield* EmailLogRepository;
			const existing = yield* logs.findDeliveryStateByProviderMessageId(
				event.providerMessageId,
			);
			if (Option.isSome(existing)) {
				yield* logs.saveDeliveryState(
					recordDeliveryEvent(existing.value, {
						status: event.outcome,
						bounceKind: event.bounceKind,
						detail: event.detail,
						rfcMessageId: event.rfcMessageId,
						at: event.occurredAt,
					}),
				);
			}

			const reason = yield* suppressionReasonFor(event);
			if (reason !== null) {
				yield* suppress({
					email: event.recipient,
					reason,
					sourceEmailLogId: Option.isSome(existing) ? existing.value.id : null,
					providerDetail: event.detail,
					note: null,
					at: event.occurredAt,
				});
			}

			return {
				matchedLog: Option.isSome(existing),
				suppressedFor: reason,
				email: normalizeEmailAddress(event.recipient),
			} satisfies DeliveryEventOutcome;
		}),
});

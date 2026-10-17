import type { DateTime } from "effect";
import type { EmailDeliveryState } from "../payloads/email-delivery-state.ts";
import type { BounceKind } from "../value-objects/bounce-kind.ts";
import {
	type EmailLogStatus,
	supersedesEmailLogStatus,
} from "../value-objects/email-log-status.ts";

export interface DeliveryEventFacts {
	readonly status: EmailLogStatus;
	readonly bounceKind: BounceKind | null;
	readonly detail: string | null;
	readonly rfcMessageId: string | null;
	readonly at: DateTime.Utc;
}

type DeliveryStateFields = Omit<EmailDeliveryState, "id">;

/**
 * Applies one provider event to a send's outcome fields. The status only moves
 * to a worse outcome, so an out-of-order `delivered` never erases a
 * complaint; each timestamp is written once and kept, because a bounce after
 * a delivery is a real sequence. A function over the fields rather than an
 * aggregate method, so the webhook path applies it to the projection without
 * loading the bodies: the aggregate calls it too, and there is one rule.
 */
export function recordDeliveryEvent<State extends DeliveryStateFields>(
	state: State,
	event: DeliveryEventFacts,
): State {
	function stamp<Value>(
		when: EmailLogStatus,
		current: Value | null,
		arriving: Value,
	): Value | null {
		return event.status === when ? (current ?? arriving) : current;
	}

	return {
		...state,
		status: supersedesEmailLogStatus(state.status, event.status)
			? event.status
			: state.status,
		deliveredAt: stamp("delivered", state.deliveredAt, event.at),
		bouncedAt: stamp("bounced", state.bouncedAt, event.at),
		bounceKind:
			event.bounceKind === null
				? state.bounceKind
				: stamp("bounced", state.bounceKind, event.bounceKind),
		complainedAt: stamp("complained", state.complainedAt, event.at),
		failureReason: event.detail ?? state.failureReason,
		// Every event on a message reports the same header: the first one kept
		// makes a replay a no-op.
		rfcMessageId: state.rfcMessageId ?? event.rfcMessageId,
		lastProviderEventAt: event.at,
	};
}

import type { DateTime } from "effect";
import { Schema } from "effect";
import { EmailMessage } from "../../message/value-objects/email-message.ts";
import { EmailSendingStream } from "../../message/value-objects/email-sending-stream.ts";
import {
	type DeliveryEventFacts,
	recordDeliveryEvent,
} from "../lib/record-delivery-event.ts";
import {
	MAXIMUM_DELIVERY_ATTEMPTS,
	nextAttemptAfterFailure,
} from "../policies/email-outbox-policy.ts";
import { BounceKind } from "../value-objects/bounce-kind.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";
import { EmailLogStatus } from "../value-objects/email-log-status.ts";

/** What every logged send starts from: the message as it is handed over. */
export interface EmailLogFacts {
	readonly id: EmailLogId;
	readonly message: EmailMessage;
	readonly stream: EmailSendingStream;
	readonly resendOfId: EmailLogId | null;
	/**
	 * The caller's idempotency key, when the same send may be asked for twice
	 * (an at-least-once event bus); null when nothing replays it.
	 */
	readonly dedupeKey: string | null;
	readonly createdAt: DateTime.Utc;
}

/**
 * One send, from the outbox to what the mailbox did with it: the audit log of
 * every message the application mails. The send path writes it, then the
 * provider's webhooks amend it, which is what turns "what we tried" into
 * "what happened": `deliveredAt`, `bouncedAt`, `complainedAt` arrive minutes
 * to hours later, found by `providerMessageId`.
 *
 * A resend is a new log of its own pointing at the first by `resendOfId`, so
 * each delivery keeps its own outcome.
 */
export class EmailLog extends Schema.TaggedClass<EmailLog>()("EmailLog", {
	id: EmailLogId,
	message: EmailMessage,
	stream: EmailSendingStream,
	status: EmailLogStatus,
	failureReason: Schema.NullOr(Schema.String),
	openedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	resendOfId: Schema.NullOr(EmailLogId),
	dedupeKey: Schema.NullOr(Schema.String),
	/**
	 * The provider's id for the message, the only handle its webhooks carry.
	 * Null until a provider took it, and forever for a send it never saw.
	 */
	providerMessageId: Schema.NullOr(Schema.String),
	/**
	 * The RFC `Message-ID` the message went out with, as the first delivery
	 * event reports it: the provider rewrites whatever was set, so it cannot be
	 * known at send time. A reply quotes it in `In-Reply-To`.
	 */
	rfcMessageId: Schema.NullOr(Schema.String),
	/** Attempts made so far, successful or not; 0 while it waits in the outbox. */
	attemptCount: Schema.Number,
	/** When the outbox owes it its next attempt; null once it is settled. */
	nextAttemptAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	/** The receiving server accepted it: the denominator of every rate. */
	deliveredAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	bouncedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	/** Set exactly when `bouncedAt` is. */
	bounceKind: Schema.NullOr(BounceKind),
	complainedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	/** When the last provider event landed: how fresh the outcome is. */
	lastProviderEventAt: Schema.NullOr(Schema.DateTimeUtcFromString),
	createdAt: Schema.DateTimeUtcFromString,
}) {
	/**
	 * Written to the outbox, owed an attempt from `createdAt` on: the only way
	 * a message enters the pipeline. A crash at any later point leaves a log
	 * still owed, never a message that silently never left.
	 */
	static pending(facts: EmailLogFacts): EmailLog {
		return new EmailLog({
			...facts,
			...unattempted,
			status: "pending",
			nextAttemptAt: facts.createdAt,
		});
	}

	/** True while the outbox owes it an attempt. */
	get isPending(): boolean {
		return this.status === "pending";
	}

	/** Every address the message goes to, the ones the suppression list is checked for. */
	get recipients(): ReadonlyArray<string> {
		return [
			...this.message.to,
			...(this.message.cc ?? []),
			...(this.message.bcc ?? []),
		];
	}

	/** True once the message is known to have reached a mailbox server. */
	get reachedMailbox(): boolean {
		return this.deliveredAt !== null;
	}

	/** The attempt succeeded: the provider took it. */
	dispatched(providerMessageId: string): EmailLog {
		return new EmailLog({
			...this,
			status: "sent",
			attemptCount: this.attemptCount + 1,
			nextAttemptAt: null,
			providerMessageId,
		});
	}

	/** Not sent, a recipient is suppressed: settled without an attempt. */
	settleSuppressed(reason: string): EmailLog {
		return new EmailLog({
			...this,
			status: "suppressed",
			nextAttemptAt: null,
			failureReason: reason,
		});
	}

	/**
	 * The provider refused the attempt: back in the outbox on the retry curve,
	 * or `failed` once the cap is reached. The last reason is kept either way.
	 */
	attemptFailed(failureReason: string, now: DateTime.Utc): EmailLog {
		const attemptCount = this.attemptCount + 1;
		const exhausted = attemptCount >= MAXIMUM_DELIVERY_ATTEMPTS;
		return new EmailLog({
			...this,
			status: exhausted ? "failed" : "pending",
			attemptCount,
			nextAttemptAt: exhausted
				? null
				: nextAttemptAfterFailure(now, attemptCount),
			failureReason,
		});
	}

	/** Applies one provider event; the rule is {@link recordDeliveryEvent}. */
	recordDeliveryEvent(event: DeliveryEventFacts): EmailLog {
		return new EmailLog({ ...this, ...recordDeliveryEvent(this, event) });
	}

	/** The first open is the one kept: later ones are the same reader. */
	opened(at: DateTime.Utc): EmailLog {
		return this.openedAt === null
			? new EmailLog({ ...this, openedAt: at })
			: this;
	}

	/** The facts a resend starts from: the same message, as a new log. */
	resendFacts(id: EmailLogId, createdAt: DateTime.Utc): EmailLogFacts {
		return {
			id,
			message: this.message,
			stream: this.stream,
			resendOfId: this.id,
			dedupeKey: null,
			createdAt,
		};
	}
}

/** The fields of a log no attempt and no provider event has touched. */
const unattempted = {
	attemptCount: 0,
	failureReason: null,
	openedAt: null,
	providerMessageId: null,
	rfcMessageId: null,
	deliveredAt: null,
	bouncedAt: null,
	bounceKind: null,
	complainedAt: null,
	lastProviderEventAt: null,
} as const;

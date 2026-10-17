import { Schema } from "effect";
import { BounceKind } from "../value-objects/bounce-kind.ts";

/**
 * The outcomes a provider webhook may report. Nothing outside the application
 * declares a send `sent`, `suppressed` or `failed`: those are facts about our
 * own call.
 */
export const EmailDeliveryOutcome = Schema.Literals([
	"delivered",
	"deferred",
	"bounced",
	"complained",
]);

export type EmailDeliveryOutcome = typeof EmailDeliveryOutcome.Type;

/**
 * One provider webhook, in the domain's terms. The adapter receiving it does
 * the translation (event names, where the id lives, how a hard bounce is
 * spelled), so a second provider is a second translator, not a second
 * pipeline.
 */
export const EmailDeliveryEvent = Schema.Struct({
	/** The provider's id for the message: how the event finds its log row. */
	providerMessageId: Schema.String,
	/**
	 * The address the event is about, so a bounce suppresses it even when the
	 * log row is gone. Losing the audit trail must not lose the suppression.
	 */
	recipient: Schema.String,
	outcome: EmailDeliveryOutcome,
	/** Set when `outcome` is `bounced`. */
	bounceKind: Schema.NullOr(BounceKind),
	/** The provider's own wording, kept verbatim for the operator. */
	detail: Schema.NullOr(Schema.String),
	/**
	 * The RFC `Message-ID` the message went out with. The provider rewrites
	 * whatever the sender set, so its webhook is the only place the real value
	 * appears, and a reply quotes exactly this string back.
	 */
	rfcMessageId: Schema.NullOr(Schema.String),
	occurredAt: Schema.DateTimeUtcFromString,
});

export type EmailDeliveryEvent = typeof EmailDeliveryEvent.Type;

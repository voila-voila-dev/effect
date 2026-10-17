import { type DateTime, Schema } from "effect";
import { EmailAddress } from "../../message/value-objects/email-address.ts";
import { EmailAuthenticationVerdict } from "../value-objects/email-authentication-verdict.ts";
import { InboundEmailAttachment } from "../value-objects/inbound-email-attachment.ts";
import { InboundEmailId } from "../value-objects/inbound-email-id.ts";
import { InboundEmailOutcome } from "../value-objects/inbound-email-outcome.ts";

/**
 * One message the application received: the mirror of the sent-mail log,
 * which answers "did their reply arrive?". The raw body is kept as it came,
 * before any quote stripping, so nothing a later parser needs is thrown away;
 * routing only adds its verdict beside it.
 */
export class InboundEmail extends Schema.TaggedClass<InboundEmail>()(
	"InboundEmail",
	{
		id: InboundEmailId,
		/** The provider's id for it: how its body is fetched, and the idempotency handle. */
		providerMessageId: Schema.String,
		/** The envelope sender. Not trusted on its own: see the verdicts. */
		from: EmailAddress,
		/** The address it was sent to, often a reply address we minted. Any string: a catch-all takes anything. */
		to: Schema.String,
		subject: Schema.String,
		rawText: Schema.String,
		rawHtml: Schema.NullOr(Schema.String),
		spf: EmailAuthenticationVerdict,
		dkim: EmailAuthenticationVerdict,
		dmarc: EmailAuthenticationVerdict,
		/** Every header, names lowercased: routing reads the auto-reply signals and the threading references. */
		headers: Schema.Record(Schema.String, Schema.String),
		attachments: Schema.Array(InboundEmailAttachment),
		outcome: InboundEmailOutcome,
		/**
		 * When `routed`, what took the message in (a conversation id), opaque
		 * to this domain: only the application that minted the reply address
		 * knows what it points at.
		 */
		routedReference: Schema.NullOr(Schema.String),
		/** When the provider received it, not when we heard about it. */
		receivedAt: Schema.DateTimeUtcFromString,
		createdAt: Schema.DateTimeUtcFromString,
	},
) {
	/** A message just received, before routing. */
	static received(input: {
		readonly id: InboundEmailId;
		readonly providerMessageId: string;
		readonly from: EmailAddress;
		readonly to: string;
		readonly subject: string;
		readonly rawText: string;
		readonly rawHtml: string | null;
		readonly spf: EmailAuthenticationVerdict;
		readonly dkim: EmailAuthenticationVerdict;
		readonly dmarc: EmailAuthenticationVerdict;
		readonly headers: Readonly<Record<string, string>>;
		readonly attachments: ReadonlyArray<InboundEmailAttachment>;
		readonly receivedAt: DateTime.Utc;
		readonly createdAt: DateTime.Utc;
	}): InboundEmail {
		return new InboundEmail({
			...input,
			outcome: "received",
			routedReference: null,
		});
	}

	/** True once routing has decided; a decided message is never routed again. */
	get isRouted(): boolean {
		return this.outcome !== "received";
	}

	/** The routing verdict, written once beside the body it was made on. */
	withOutcome(
		outcome: InboundEmailOutcome,
		routedReference: string | null,
	): InboundEmail {
		return new InboundEmail({ ...this, outcome, routedReference });
	}
}

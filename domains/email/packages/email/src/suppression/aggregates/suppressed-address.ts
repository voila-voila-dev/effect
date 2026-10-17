import { type DateTime, Schema } from "effect";
import { normalizeEmailAddress } from "../../message/lib/normalize-email-address.ts";
import { SuppressedAddressId } from "../value-objects/suppressed-address-id.ts";
import { SuppressionReason } from "../value-objects/suppression-reason.ts";

/**
 * An address the application has stopped mailing. It outranks every other
 * list, and applies to transactional mail too: a password reset to an address
 * that does not exist bounces like a newsletter and costs the same
 * reputation.
 *
 * The address is the identity, stored normalized, so every lookup agrees on
 * what "the same address" is. `firstSuppressedAt` is never rewritten: a
 * second bounce on a suppressed address is not news.
 */
export class SuppressedAddress extends Schema.TaggedClass<SuppressedAddress>()(
	"SuppressedAddress",
	{
		id: SuppressedAddressId,
		/** Normalized: see {@link normalizeEmailAddress}. */
		email: Schema.String,
		reason: SuppressionReason,
		/** The logged send that proved it, when there was one. */
		sourceEmailLogId: Schema.NullOr(Schema.String),
		/** The provider's own wording, kept verbatim for the operator. */
		providerDetail: Schema.NullOr(Schema.String),
		/** What an operator wrote when blocking it by hand. */
		note: Schema.NullOr(Schema.String),
		firstSuppressedAt: Schema.DateTimeUtcFromString,
		/** The last time an event confirmed it: how stale the entry is. */
		lastConfirmedAt: Schema.DateTimeUtcFromString,
	},
) {
	/** The first time an address is suppressed. */
	static open(input: {
		readonly id: SuppressedAddressId;
		readonly email: string;
		readonly reason: SuppressionReason;
		readonly sourceEmailLogId: string | null;
		readonly providerDetail: string | null;
		readonly note: string | null;
		readonly at: DateTime.Utc;
	}): SuppressedAddress {
		return new SuppressedAddress({
			id: input.id,
			email: normalizeEmailAddress(input.email),
			reason: input.reason,
			sourceEmailLogId: input.sourceEmailLogId,
			providerDetail: input.providerDetail,
			note: input.note,
			firstSuppressedAt: input.at,
			lastConfirmedAt: input.at,
		});
	}

	/**
	 * A later event on an address already suppressed. The reason only ever
	 * escalates to a complaint: "they reported us" is the fact an operator must
	 * see before releasing, whatever bounced afterwards.
	 */
	reconfirm(input: {
		readonly reason: SuppressionReason;
		readonly sourceEmailLogId: string | null;
		readonly providerDetail: string | null;
		readonly at: DateTime.Utc;
	}): SuppressedAddress {
		const escalates =
			input.reason === "Complaint" && this.reason !== "Complaint";
		return new SuppressedAddress({
			...this,
			reason: escalates ? input.reason : this.reason,
			sourceEmailLogId: input.sourceEmailLogId ?? this.sourceEmailLogId,
			providerDetail: input.providerDetail ?? this.providerDetail,
			lastConfirmedAt: input.at,
		});
	}
}

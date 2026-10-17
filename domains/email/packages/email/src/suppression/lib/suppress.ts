import { type DateTime, Effect, Option } from "effect";
import { EmailIds } from "../../ids/email-ids.ts";
import { normalizeEmailAddress } from "../../message/lib/normalize-email-address.ts";
import { SuppressedAddress } from "../aggregates/suppressed-address.ts";
import { SuppressionList } from "../services/suppression-list.ts";
import { SuppressedAddressId } from "../value-objects/suppressed-address-id.ts";
import type { SuppressionReason } from "../value-objects/suppression-reason.ts";

/**
 * Opens the suppression of an address, or reconfirms the one it already has:
 * every write to the list goes through here, so a replayed event or a second
 * block never resets when the suppression started.
 */
export function suppress(input: {
	readonly email: string;
	readonly reason: SuppressionReason;
	readonly sourceEmailLogId: string | null;
	readonly providerDetail: string | null;
	readonly note: string | null;
	readonly at: DateTime.Utc;
}): Effect.Effect<SuppressedAddress, never, SuppressionList> {
	return Effect.gen(function* () {
		const suppressions = yield* SuppressionList;
		const email = normalizeEmailAddress(input.email);
		const existing = yield* suppressions.findByEmail(email);
		if (Option.isSome(existing)) {
			return yield* suppressions.save(existing.value.reconfirm(input));
		}
		const ids = yield* EmailIds;
		return yield* suppressions.save(
			SuppressedAddress.open({
				...input,
				id: SuppressedAddressId.make(yield* ids.next),
				email,
			}),
		);
	});
}

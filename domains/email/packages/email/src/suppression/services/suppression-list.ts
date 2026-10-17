import { Context, type Effect, type Option } from "effect";
import type { Page, PageRequest } from "../../paging/page.ts";
import type { SuppressedAddress } from "../aggregates/suppressed-address.ts";
import type { SuppressionReason } from "../value-objects/suppression-reason.ts";

export interface SuppressedAddressFilter {
	/** A part of the address. */
	readonly query?: string;
	readonly reason?: SuppressionReason;
}

/**
 * The addresses the application refuses to mail. The domain names the
 * contract; an adapter keeps them. `areSuppressed` takes a batch because a
 * campaign checks hundreds of addresses at a time. Every address in and out
 * is normalized.
 */
export class SuppressionList extends Context.Service<
	SuppressionList,
	{
		readonly save: (
			address: SuppressedAddress,
		) => Effect.Effect<SuppressedAddress>;
		readonly findByEmail: (
			email: string,
		) => Effect.Effect<Option.Option<SuppressedAddress>>;
		/** Which of these addresses are suppressed; the others are mailable. */
		readonly areSuppressed: (
			emails: ReadonlyArray<string>,
		) => Effect.Effect<ReadonlySet<string>>;
		/** Newest first. */
		readonly search: (
			filter: SuppressedAddressFilter,
			page: PageRequest,
		) => Effect.Effect<Page<SuppressedAddress>>;
		/** Lets the address be mailed again; nothing happens when it was not suppressed. */
		readonly delete: (email: string) => Effect.Effect<void>;
	}
>()("@voila.dev/email/SuppressionList") {}

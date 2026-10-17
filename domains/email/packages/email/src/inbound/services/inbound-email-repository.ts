import { Context, type Effect, type Option } from "effect";
import type { Page, PageRequest } from "../../paging/page.ts";
import type { InboundEmail } from "../aggregates/inbound-email.ts";
import type { InboundEmailId } from "../value-objects/inbound-email-id.ts";
import type { InboundEmailOutcome } from "../value-objects/inbound-email-outcome.ts";

export interface InboundEmailFilter {
	/** A part of the sender's address. */
	readonly from?: string;
	readonly outcome?: InboundEmailOutcome;
}

/** Where received messages are kept. */
export class InboundEmailRepository extends Context.Service<
	InboundEmailRepository,
	{
		readonly save: (email: InboundEmail) => Effect.Effect<InboundEmail>;
		readonly get: (
			id: InboundEmailId,
		) => Effect.Effect<Option.Option<InboundEmail>>;
		/** Newest received first. */
		readonly search: (
			filter: InboundEmailFilter,
			page: PageRequest,
		) => Effect.Effect<Page<InboundEmail>>;
		/** The idempotency handle: a redelivered webhook must not store a message twice. */
		readonly findByProviderMessageId: (
			providerMessageId: string,
		) => Effect.Effect<Option.Option<InboundEmail>>;
	}
>()("@voila.dev/email/InboundEmailRepository") {}

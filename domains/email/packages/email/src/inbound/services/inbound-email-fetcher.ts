import { Context, type Effect } from "effect";
import type { InboundEmailFetchError } from "../errors/inbound-email-fetch-error.ts";
import type { EmailAuthenticationVerdict } from "../value-objects/email-authentication-verdict.ts";

/** What a "received" webhook does not carry, fetched by the message's id. */
export interface FetchedInboundContent {
	readonly text: string;
	readonly html: string | null;
	readonly spf: EmailAuthenticationVerdict;
	readonly dkim: EmailAuthenticationVerdict;
	readonly dmarc: EmailAuthenticationVerdict;
	/** Names lowercased, whatever the provider's casing. */
	readonly headers: Readonly<Record<string, string>>;
}

/** One file's bytes, with the type the provider reported for them. */
export interface FetchedInboundAttachment {
	readonly bytes: Uint8Array;
	readonly contentType: string;
}

/**
 * Pulls a received message's content back from the provider. A contract, so
 * the domain does not know which provider receives the mail.
 */
export class InboundEmailFetcher extends Context.Service<
	InboundEmailFetcher,
	{
		readonly fetchContent: (
			providerMessageId: string,
		) => Effect.Effect<FetchedInboundContent, InboundEmailFetchError>;
		/** One file's bytes, fetched only for mail worth keeping. */
		readonly fetchAttachment: (
			providerMessageId: string,
			attachmentId: string,
		) => Effect.Effect<FetchedInboundAttachment, InboundEmailFetchError>;
	}
>()("@voila.dev/email/InboundEmailFetcher") {}

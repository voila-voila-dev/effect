import { Context, type DateTime, type Effect } from "effect";
import type { EmailAddress } from "../../message/value-objects/email-address.ts";
import type { InvalidReplyTokenError } from "../errors/invalid-reply-token-error.ts";

/** What a reply address carries: an opaque payload, until a moment. */
export interface ReplyBinding {
	readonly payload: string;
	readonly expiresAt: DateTime.Utc;
}

/**
 * Per-thread reply addresses: an answer to an automated mail routes back to
 * the exact thing it concerns, with no lookup table and no write when the
 * mail is sent. The address is a signed token, so it authenticates as well as
 * routes: a guessed or altered one does not verify. The payload is opaque
 * here; only whoever minted it knows how to read it back.
 */
export class ReplyAddresses extends Context.Service<
	ReplyAddresses,
	{
		/** The address a message's `replyTo` carries for this binding. */
		readonly mint: (binding: ReplyBinding) => Effect.Effect<EmailAddress>;
		/** The payload of a reply address's local part (before the `@`). */
		readonly verify: (
			localPart: string,
		) => Effect.Effect<string, InvalidReplyTokenError>;
	}
>()("@voila.dev/email/ReplyAddresses") {}

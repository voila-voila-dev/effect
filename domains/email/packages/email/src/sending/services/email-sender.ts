import { Context, type Effect } from "effect";
import type { EmailMessage } from "../../message/value-objects/email-message.ts";
import type { EmailSendError } from "../errors/email-send-error.ts";

/**
 * Delivers rendered messages through a mail provider. Which provider is the
 * composition root's choice; code that sends mail depends on this alone.
 */
export class EmailSender extends Context.Service<
	EmailSender,
	{
		/** Hands one message to the provider; succeeds with the provider's id for it. */
		readonly send: (
			message: EmailMessage,
		) => Effect.Effect<string, EmailSendError>;
		/**
		 * Hands many messages over, in as few calls as the provider allows;
		 * succeeds with their ids in input order. One failure fails the whole
		 * call, and messages already handed over stay sent.
		 */
		readonly sendMany: (
			messages: ReadonlyArray<EmailMessage>,
		) => Effect.Effect<ReadonlyArray<string>, EmailSendError>;
	}
>()("@voila.dev/email/EmailSender") {}

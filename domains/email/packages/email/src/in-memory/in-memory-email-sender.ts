import { Effect, Layer } from "effect";
import type { EmailMessage } from "../message/email-message.ts";
import { EmailSendError } from "../sender/email-send-error.ts";
import { EmailSender } from "../sender/email-sender.ts";

export interface SentEmail {
	readonly id: string;
	readonly message: EmailMessage;
}

/**
 * A sender that keeps what it is handed, for tests. `sent` lists the messages
 * in order with the ids they were given (`email-1`, `email-2`…); a message to
 * an address in `failingRecipients` fails with {@link EmailSendError} the way
 * a provider refusal would, and is not kept.
 */
export function inMemoryEmailSender() {
	const sent: Array<SentEmail> = [];
	const failingRecipients = new Set<string>();

	const send = (message: EmailMessage) =>
		Effect.suspend(() => {
			const refused = message.to.find((address) =>
				failingRecipients.has(address),
			);
			if (refused !== undefined) {
				return Effect.fail(
					new EmailSendError({ message: `refused for ${refused}` }),
				);
			}
			const id = `email-${sent.length + 1}`;
			sent.push({ id, message });
			return Effect.succeed(id);
		});

	const service: typeof EmailSender.Service = {
		send,
		sendMany: (messages) => Effect.forEach(messages, send),
	};

	return {
		sent,
		failingRecipients,
		service,
		layer: Layer.succeed(EmailSender, service),
	};
}

import { Effect, Layer } from "effect";
import type { EmailMessage } from "../../message/value-objects/email-message.ts";
import { EmailSender } from "../services/email-sender.ts";

function describe(message: EmailMessage): string {
	const attachments = message.attachments?.length
		? ` (+${message.attachments.map((attachment) => attachment.filename).join(", ")})`
		: "";
	const replyTo = message.replyTo
		? ` (reply-to ${message.replyTo.join(", ")})`
		: "";
	return `[email] ${message.from} → ${message.to.join(", ")}: ${message.subject}${replyTo}${attachments}`;
}

/**
 * A sender for local development: logs each message at info, with its text,
 * instead of sending it, so a flow that mails a sign-in code works with no
 * provider account and the code is right there in the output.
 */
export function consoleEmailSender(): typeof EmailSender.Service {
	let count = 0;
	const send = (message: EmailMessage) =>
		Effect.logInfo(describe(message), message.text).pipe(
			Effect.map(() => {
				count += 1;
				return `console-${count}`;
			}),
		);
	return {
		send,
		sendMany: (messages) => Effect.forEach(messages, send),
	};
}

/** {@link consoleEmailSender} as the {@link EmailSender} layer. */
export const consoleEmailSenderLayer: Layer.Layer<EmailSender> = Layer.sync(
	EmailSender,
	consoleEmailSender,
);

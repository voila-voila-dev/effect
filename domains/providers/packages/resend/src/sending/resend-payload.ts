import { base64FromBytes } from "@voila.dev/crypto";
import type { EmailMessage } from "@voila.dev/email";

/** A message as Resend's `POST /emails` takes it. */
export function resendPayload(message: EmailMessage) {
	return {
		from: message.from,
		to: message.to,
		...(message.cc && { cc: message.cc }),
		...(message.bcc && { bcc: message.bcc }),
		...(message.replyTo && { reply_to: message.replyTo }),
		subject: message.subject,
		text: message.text,
		...(message.html !== undefined && { html: message.html }),
		...(message.headers && { headers: message.headers }),
		...(message.attachments?.length && {
			attachments: message.attachments.map((attachment) => ({
				filename: attachment.filename,
				content: base64FromBytes(attachment.content),
				content_type: attachment.contentType,
			})),
		}),
	};
}

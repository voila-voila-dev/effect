import { Effect, Layer } from "effect";
import {
	type ReceivedAttachment,
	type ReceivedEmail,
	ResendReceivingError,
} from "./received-email.ts";
import { ResendReceiving } from "./resend-receiving.ts";

/**
 * Received mail held in memory, for tests. `seedEmail` and `seedAttachment`
 * register what Resend would answer; anything not seeded fails with
 * {@link ResendReceivingError}, as a missing message would.
 */
export function inMemoryResendReceiving() {
	const emails = new Map<string, ReceivedEmail>();
	const attachments = new Map<string, ReceivedAttachment>();
	const attachmentKey = (emailId: string, attachmentId: string) =>
		`${emailId}/${attachmentId}`;

	const service: typeof ResendReceiving.Service = {
		getEmail: (emailId) => {
			const email = emails.get(emailId);
			return email === undefined
				? Effect.fail(
						new ResendReceivingError({ message: `no email ${emailId}` }),
					)
				: Effect.succeed(email);
		},
		getAttachment: (emailId, attachmentId) => {
			const attachment = attachments.get(attachmentKey(emailId, attachmentId));
			return attachment === undefined
				? Effect.fail(
						new ResendReceivingError({
							message: `no attachment ${attachmentId} on ${emailId}`,
						}),
					)
				: Effect.succeed(attachment);
		},
	};

	return {
		seedEmail: (emailId: string, email: ReceivedEmail) => {
			emails.set(emailId, email);
		},
		seedAttachment: (
			emailId: string,
			attachmentId: string,
			attachment: ReceivedAttachment,
		) => {
			attachments.set(attachmentKey(emailId, attachmentId), attachment);
		},
		service,
		layer: Layer.succeed(ResendReceiving, service),
	};
}

import { Context, type Effect } from "effect";
import type {
	ReceivedAttachment,
	ReceivedEmail,
	ResendReceivingError,
} from "./received-email.ts";

/** Resend's receiving API: what a received message said, by the `email_id` its webhook carried. */
export class ResendReceiving extends Context.Service<
	ResendReceiving,
	{
		readonly getEmail: (
			emailId: string,
		) => Effect.Effect<ReceivedEmail, ResendReceivingError>;
		/** The bytes of one attachment. Separate from {@link getEmail}: pull them only for mail you keep. */
		readonly getAttachment: (
			emailId: string,
			attachmentId: string,
		) => Effect.Effect<ReceivedAttachment, ResendReceivingError>;
	}
>()("@voila.dev/resend/ResendReceiving") {}

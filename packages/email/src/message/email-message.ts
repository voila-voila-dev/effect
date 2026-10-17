import { Schema } from "effect";
import { EmailAddress } from "./email-address.ts";
import { EmailAttachment } from "./email-attachment.ts";

const Recipients = Schema.Array(EmailAddress).pipe(
	Schema.check(Schema.isMinLength(1)),
);

/**
 * A rendered message, ready for any {@link EmailSender}. Rendering, tracking
 * and the choice of sender address are the application's; a sender only
 * delivers what it is handed.
 */
export const EmailMessage = Schema.Struct({
	/** `hello@example.com` or `Example <hello@example.com>`, on a domain the provider has verified. */
	from: Schema.NonEmptyString,
	to: Recipients,
	cc: Schema.optional(Recipients),
	bcc: Schema.optional(Recipients),
	/** Where a reply goes when it should not go to `from`. */
	replyTo: Schema.optional(Recipients),
	subject: Schema.String,
	text: Schema.String,
	html: Schema.optional(Schema.String),
	attachments: Schema.optional(Schema.Array(EmailAttachment)),
	/** Extra headers (`List-Unsubscribe`…), passed through as they are. */
	headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
});

export type EmailMessage = typeof EmailMessage.Type;

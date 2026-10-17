import { Schema } from "effect";

/**
 * A file sent along with a message. `content` is the raw bytes: a sender
 * encodes them for its wire format, so the caller never handles base64.
 */
export const EmailAttachment = Schema.Struct({
	filename: Schema.String,
	content: Schema.Uint8Array,
	/** The MIME type the mail client is told, `application/pdf`. */
	contentType: Schema.String,
});

export type EmailAttachment = typeof EmailAttachment.Type;

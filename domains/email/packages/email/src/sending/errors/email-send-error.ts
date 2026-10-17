import { Schema } from "effect";

/**
 * The provider did not take the message: refused it, stayed unavailable past
 * the sender's retries, or answered something unreadable. Nothing was sent
 * for this message, so the caller may try again later.
 */
export class EmailSendError extends Schema.TaggedError<EmailSendError>()(
	"EmailSendError",
	{ message: Schema.String },
) {}

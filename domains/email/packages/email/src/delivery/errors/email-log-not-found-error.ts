import { Schema } from "effect";

/** No logged send carries this id. */
export class EmailLogNotFoundError extends Schema.TaggedError<EmailLogNotFoundError>()(
	"EmailLogNotFoundError",
	{ emailLogId: Schema.String },
) {}

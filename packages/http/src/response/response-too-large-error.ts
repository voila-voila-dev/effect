import { Schema } from "effect";

/** The body went past the bound the caller set; it was not read further. */
export class ResponseTooLargeError extends Schema.TaggedError<ResponseTooLargeError>()(
	"ResponseTooLargeError",
	{ maxBytes: Schema.Int },
) {}

import { Schema } from "effect";

/** The call outlived its deadline and was interrupted, its request aborted. */
export class OutboundTimeoutError extends Schema.TaggedError<OutboundTimeoutError>()(
	"OutboundTimeoutError",
	{ timeoutMilliseconds: Schema.Number },
) {}

import { Schema } from "effect";

/** No received message carries this id. */
export class InboundEmailNotFoundError extends Schema.TaggedError<InboundEmailNotFoundError>()(
	"InboundEmailNotFoundError",
	{ inboundEmailId: Schema.String },
) {}

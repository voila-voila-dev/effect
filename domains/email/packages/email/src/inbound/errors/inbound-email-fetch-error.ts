import { Schema } from "effect";

/** Pulling a received message, or one of its files, back from the provider failed. */
export class InboundEmailFetchError extends Schema.TaggedError<InboundEmailFetchError>()(
	"InboundEmailFetchError",
	{ message: Schema.String },
) {}

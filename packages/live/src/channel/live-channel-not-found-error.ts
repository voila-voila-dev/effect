import { Schema } from "effect";

/** A page asked for a channel the application never declared. */
export class LiveChannelNotFoundError extends Schema.TaggedError<LiveChannelNotFoundError>()(
	"LiveChannelNotFoundError",
	{ channel: Schema.String },
) {}

import { Schema } from "effect";

/**
 * The partner answered, with a status outside 2xx. `body` is the start of
 * what it said, for the log: enough to tell an expired key from a bad input.
 */
export class OutboundStatusError extends Schema.TaggedError<OutboundStatusError>()(
	"OutboundStatusError",
	{ status: Schema.Int, body: Schema.String },
) {}

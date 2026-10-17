import { Schema } from "effect";

/**
 * The store could not take or hand back messages. Raised inside a caller's
 * transaction, it rolls the change back with it: a change never commits
 * without its events.
 */
export class OutboxStoreError extends Schema.TaggedError<OutboxStoreError>()(
	"OutboxStoreError",
	{
		message: Schema.String,
		cause: Schema.optional(Schema.Defect()),
	},
) {}

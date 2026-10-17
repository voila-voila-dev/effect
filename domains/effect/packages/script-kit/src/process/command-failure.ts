import { Schema } from "effect";

/** A subprocess run by `commandText` exited with a non-zero code. */
export class CommandFailure extends Schema.TaggedError<CommandFailure>()(
	"CommandFailure",
	{ message: Schema.String },
) {}

import { Schema } from "effect";

/** The bus could not take a publication. Live is best-effort: a publisher logs it and goes on. */
export class LivePublishError extends Schema.TaggedError<LivePublishError>()(
	"LivePublishError",
	{ message: Schema.String },
) {}

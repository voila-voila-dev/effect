import { Schema } from "effect";

/**
 * The body is not what the adapter expects: cut off mid-stream, not JSON, or
 * JSON of another shape. A partner changing its answer surfaces here, typed,
 * rather than as an `undefined` three calls later.
 */
export class ResponseDecodeError extends Schema.TaggedError<ResponseDecodeError>()(
	"ResponseDecodeError",
	{ cause: Schema.Defect() },
) {}

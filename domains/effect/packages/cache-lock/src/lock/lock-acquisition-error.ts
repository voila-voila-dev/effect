import { Schema } from "effect";

/**
 * The lock was still held when the acquisition timeout ran out, or the backend
 * failed while acquiring it. The guarded effect never ran, so retrying is
 * safe; whether to retry, fail or fall back is the caller's choice.
 */
export class LockAcquisitionError extends Schema.TaggedError<LockAcquisitionError>()(
	"LockAcquisitionError",
	{ key: Schema.String, reason: Schema.String },
) {}

import { Schema } from "effect";

/**
 * A value could not be sealed or opened: no key is configured
 * (`missing-key`), or the sealed text was altered, sealed under another key or
 * bound to another record (`unreadable`). Never carries the value.
 */
export class SecretBoxError extends Schema.TaggedError<SecretBoxError>()(
	"SecretBoxError",
	{ reason: Schema.Literals(["missing-key", "unreadable"]) },
) {}

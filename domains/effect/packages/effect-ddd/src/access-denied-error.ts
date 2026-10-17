import { Schema } from "effect";

/**
 * The one failure a gate raises. A use case's metrics count it as `denied`
 * rather than `failed`, so a permission problem does not hide in the error
 * rate. Subclass it when callers need to tell refusals apart.
 */
export class AccessDeniedError extends Schema.TaggedError<AccessDeniedError>()(
	"AccessDeniedError",
	{},
) {}

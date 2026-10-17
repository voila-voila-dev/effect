import { Schema } from "effect";

/**
 * A presented token was refused. `malformed`: not a token of this shape, or a
 * genuine one whose payload no longer decodes (issued before a schema
 * change). `forged`: the tag does not match, an edit, another kind's token or
 * another key. `expired`: genuine but past its expiry.
 *
 * `expired` is only reported for a token whose tag matched, so telling it
 * apart (to offer a fresh link) reveals nothing to someone without the key.
 */
export class InvalidTokenError extends Schema.TaggedError<InvalidTokenError>()(
	"InvalidTokenError",
	{
		purpose: Schema.String,
		reason: Schema.Literals(["malformed", "forged", "expired"]),
	},
) {}

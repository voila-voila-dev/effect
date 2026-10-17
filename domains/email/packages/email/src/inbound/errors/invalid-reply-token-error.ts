import { Schema } from "effect";

/**
 * A reply address that did not verify: malformed, forged or expired. One
 * error for all three on purpose: which check failed is nothing a caller
 * should branch on, nor anything worth telling a forger.
 */
export class InvalidReplyTokenError extends Schema.TaggedError<InvalidReplyTokenError>()(
	"InvalidReplyTokenError",
	{},
) {}

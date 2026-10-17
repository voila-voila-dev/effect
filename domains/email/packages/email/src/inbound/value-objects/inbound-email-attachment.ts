import { Schema } from "effect";

/**
 * A file that arrived on a received message: its metadata, never its bytes.
 * A webhook carries only this much, so a large file cannot blow its body
 * limit; the bytes are fetched by `id` only for mail worth keeping.
 */
export const InboundEmailAttachment = Schema.Struct({
	/** The provider's handle for the file, which a fetch pulls the bytes by. */
	id: Schema.String,
	filename: Schema.String,
	contentType: Schema.String,
});

export type InboundEmailAttachment = typeof InboundEmailAttachment.Type;

import { Schema } from "effect";

/** No response came back: the connection failed, or the call was aborted. */
export class OutboundTransportError extends Schema.TaggedError<OutboundTransportError>()(
	"OutboundTransportError",
	{ partner: Schema.String, cause: Schema.Defect() },
) {}

import { Schema } from "effect";

export const InboundEmailId = Schema.String.pipe(
	Schema.brand("InboundEmailId"),
);

export type InboundEmailId = typeof InboundEmailId.Type;

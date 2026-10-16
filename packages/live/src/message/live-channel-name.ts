import { Schema } from "effect";

/** A channel's name, as a socket URL carries it: `board`, `console.orders`. */
export const LiveChannelName = Schema.String.check(
	Schema.isPattern(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/u),
	Schema.isMaxLength(64),
).pipe(Schema.brand("LiveChannelName"));

export type LiveChannelName = typeof LiveChannelName.Type;

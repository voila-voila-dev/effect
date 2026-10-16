import { Schema } from "effect";
import { LiveChannelName } from "./live-channel-name.ts";

/**
 * What a publisher hands the live bus: something happened to a subject. Ids
 * and enumerations only, never a name or a text: the page loads what it shows
 * with its own permissions. `attributes` carry what subscribers filter on.
 */
export const LivePublication = Schema.Struct({
	channel: LiveChannelName,
	subjectType: Schema.String,
	subjectId: Schema.String,
	kind: Schema.String,
	at: Schema.DateTimeUtcFromString,
	attributes: Schema.Record(Schema.String, Schema.String),
});
export type LivePublication = typeof LivePublication.Type;

/**
 * A publication as the bus delivered it. `seq` is the channel's position,
 * opaque to the page: a reconnecting page hands back the last one it read.
 */
export const LiveMessage = Schema.Struct({
	...LivePublication.fields,
	seq: Schema.String,
});
export type LiveMessage = typeof LiveMessage.Type;

/** What the server sends on a socket: the messages of one batch, or of a replay. */
export const LiveFrame = Schema.Struct({ messages: Schema.Array(LiveMessage) });
export type LiveFrame = typeof LiveFrame.Type;

import { Option, Schema } from "effect";
import type { LiveChannel } from "../channel/live-channel.ts";
import type { LiveMessage } from "../message/live-message.ts";
import type { LiveSocket, LiveSocketHub } from "./live-socket-hub.ts";

/** What a page may say on its socket: the filter it now looks through. A ping or anything else is ignored. */
const InboundFrame = Schema.fromJsonString(
	Schema.Struct({ filter: Schema.Unknown }),
);
const decodeInboundFrame = Schema.decodeUnknownOption(InboundFrame);

/**
 * Registers the socket with everything its channel publishes and sends at once
 * what the page missed, read while its subscription was authorized. A message
 * published between that read and this call is not replayed: the page reads on
 * from the next one.
 */
export function openLiveSocket(options: {
	readonly hub: LiveSocketHub;
	readonly channel: LiveChannel;
	readonly socket: LiveSocket;
	readonly missed: ReadonlyArray<LiveMessage>;
}): void {
	const { hub, channel, socket, missed } = options;
	hub.add(channel.name, socket, Option.getOrThrow(channel.matcher(undefined)));
	hub.sendNow(socket, missed);
}

/** A filter the channel reads replaces the socket's; one it cannot read leaves the socket as it was. */
export function receiveLiveFrame(options: {
	readonly hub: LiveSocketHub;
	readonly channel: LiveChannel;
	readonly socket: LiveSocket;
	readonly frame: string;
}): void {
	const { hub, channel, socket, frame } = options;
	const matcher = Option.flatMap(decodeInboundFrame(frame), (inbound) =>
		channel.matcher(inbound.filter),
	);
	if (Option.isSome(matcher)) {
		hub.refilter(socket, matcher.value);
	}
}

import type { AccessDeniedError } from "@voila.dev/effect-ddd";
import { Effect } from "effect";
import type { LiveChannel } from "../channel/live-channel.ts";
import { LiveChannelNotFoundError } from "../channel/live-channel-not-found-error.ts";
import type { LiveMessage } from "../message/live-message.ts";
import { LiveLog } from "./live-log.ts";

/**
 * Lets a page open a channel when the channel's own gate admits `input`, and
 * answers what it missed after `since`. Call it before the WebSocket upgrade,
 * so the transport never decides who may listen.
 */
export function openLiveSubscription<I, E extends AccessDeniedError>(options: {
	readonly channels: ReadonlyMap<string, LiveChannel<I, E>>;
	readonly channel: string;
	readonly input: I;
	readonly since?: string | undefined;
}): Effect.Effect<
	ReadonlyArray<LiveMessage>,
	LiveChannelNotFoundError | E,
	LiveLog
> {
	return Effect.gen(function* () {
		const channel = options.channels.get(options.channel);
		if (channel === undefined) {
			return yield* new LiveChannelNotFoundError({ channel: options.channel });
		}
		yield* channel.gate.check(options.input);
		return options.since === undefined
			? []
			: yield* (yield* LiveLog).since(channel.name, options.since);
	});
}

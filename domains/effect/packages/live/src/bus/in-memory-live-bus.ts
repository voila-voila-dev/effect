import { Effect, Layer } from "effect";
import type { LiveMessage, LivePublication } from "../message/live-message.ts";
import type { LiveSocketHub } from "../socket/live-socket-hub.ts";
import { LIVE_REPLAY_DEPTH, LiveLog } from "./live-log.ts";
import { LivePublisher } from "./live-publisher.ts";

export interface InMemoryLiveBusOptions {
	/** How many messages per channel a reconnecting page can catch up on. Defaults to {@link LIVE_REPLAY_DEPTH}. */
	readonly replayDepth?: number;
}

/**
 * The single-process bus of local development and tests: numbers each
 * channel's messages from 1, keeps the last `replayDepth`, and hands each one
 * to the hub. `layer` provides both `LivePublisher` and `LiveLog`.
 */
export function makeInMemoryLiveBus(
	hub: LiveSocketHub,
	options: InMemoryLiveBusOptions = {},
) {
	const replayDepth = options.replayDepth ?? LIVE_REPLAY_DEPTH;
	const kept = new Map<string, Array<LiveMessage>>();
	const counters = new Map<string, number>();

	function append(publication: LivePublication): void {
		const position = (counters.get(publication.channel) ?? 0) + 1;
		counters.set(publication.channel, position);
		const message: LiveMessage = { ...publication, seq: String(position) };
		const channelMessages = kept.get(publication.channel) ?? [];
		channelMessages.push(message);
		channelMessages.splice(0, channelMessages.length - replayDepth);
		kept.set(publication.channel, channelMessages);
		hub.deliver(message);
	}

	const log = LiveLog.of({
		since: (channel, seq) =>
			Effect.sync(() =>
				(kept.get(channel) ?? []).filter(
					(message) => Number(message.seq) > Number(seq),
				),
			),
	});
	const publisher = LivePublisher.of({
		publish: (publication) => Effect.sync(() => append(publication)),
	});

	return {
		log,
		publisher,
		layer: Layer.mergeAll(
			Layer.succeed(LiveLog, log),
			Layer.succeed(LivePublisher, publisher),
		),
	};
}

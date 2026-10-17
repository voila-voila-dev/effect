import type { AccessDeniedError, Gate } from "@voila.dev/effect-ddd";
import { Option, Schema } from "effect";
import type { LiveChannelName } from "../message/live-channel-name.ts";
import type { LiveMessage } from "../message/live-message.ts";

/** Which messages of a channel one subscriber keeps. */
export type LiveMatcher = (message: LiveMessage) => boolean;

/**
 * A named stream of messages and who may read it. The application declares its
 * channels; the bus knows only this shape. `gate` decides on whatever the
 * application passes when a page opens the channel (usually its actor).
 * `matcher` turns the filter a page sends into the messages it keeps, and is
 * none for a filter it cannot read.
 */
export interface LiveChannel<
	in I = never,
	out E extends AccessDeniedError = AccessDeniedError,
> {
	readonly name: LiveChannelName;
	readonly gate: Gate<I, E>;
	readonly matcher: (filter: unknown) => Option.Option<LiveMatcher>;
}

function keepEverything(): boolean {
	return true;
}

/** A page that sends no filter keeps every message of the channel. */
export function defineLiveChannel<I, E extends AccessDeniedError, F>(options: {
	readonly name: LiveChannelName;
	readonly gate: Gate<I, E>;
	readonly filter: Schema.Codec<F, unknown>;
	readonly matches: (filter: F, message: LiveMessage) => boolean;
}): LiveChannel<I, E> {
	const decodeFilter = Schema.decodeUnknownOption(options.filter);
	return {
		name: options.name,
		gate: options.gate,
		matcher: (filter) =>
			filter === undefined
				? Option.some(keepEverything)
				: Option.map(
						decodeFilter(filter),
						(decoded) => (message: LiveMessage) =>
							options.matches(decoded, message),
					),
	};
}

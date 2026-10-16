import { Context, type Effect } from "effect";
import type { LiveMessage } from "../message/live-message.ts";

/** What a reconnecting page can catch up on, per channel. */
export const LIVE_REPLAY_DEPTH = 1000;

/**
 * Where a channel's recent messages are kept, so a page that reconnects
 * catches up from the last `seq` it read. It never fails: when the store is
 * out of reach, the page reads on from now.
 */
export class LiveLog extends Context.Service<
	LiveLog,
	{
		readonly since: (
			channel: string,
			seq: string,
		) => Effect.Effect<ReadonlyArray<LiveMessage>>;
	}
>()("@voila.dev/live/LiveLog") {}

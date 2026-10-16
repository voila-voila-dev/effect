import {
	type Duration,
	Effect,
	Layer,
	Option,
	Schedule,
	Schema,
	type Scope,
} from "effect";
import { Redis } from "effect/persistence";
import { LIVE_REPLAY_DEPTH, LiveLog } from "../bus/live-log.ts";
import { LivePublishError } from "../bus/live-publish-error.ts";
import { LivePublisher } from "../bus/live-publisher.ts";
import { type LiveMessage, LivePublication } from "../message/live-message.ts";
import type { LiveSocketHub } from "../socket/live-socket-hub.ts";

// One Redis stream per channel. The stream id is the message's `seq`, shared
// by every process, and the stream keeps the last LIVE_REPLAY_DEPTH entries,
// so a page that reconnects to another process catches up from the same log,
// and a reader whose connection dropped resumes from the last id it read.

const MESSAGE_FIELD = "m";

/** How long one read waits for news before asking again. */
const BLOCK_MILLISECONDS = 5000;
const READ_COUNT = 500;

/** The reader's connection, as `CLIENT LIST` names it. */
export const LIVE_READER_CLIENT_NAME = "live-reader";

export interface RedisLiveOptions {
	/** Put in front of every channel's stream key. Defaults to `"live:"`. */
	readonly prefix?: string;
}

/** A RESP3 read is a map of stream key to entries, or null when nothing came. */
const StreamEntries = Schema.Array(
	Schema.Tuple([Schema.String, Schema.Array(Schema.String)]),
);
const ReadReply = Schema.NullOr(Schema.Record(Schema.String, StreamEntries));
const decodeEntries = Schema.decodeUnknownOption(StreamEntries);
const decodeRead = Schema.decodeUnknownOption(ReadReply);
const decodePublication = Schema.decodeUnknownOption(
	Schema.fromJsonString(LivePublication),
);
const encodePublication = Schema.encodeSync(
	Schema.fromJsonString(LivePublication),
);

export function liveStreamKey(
	channel: string,
	options: RedisLiveOptions = {},
): string {
	return `${options.prefix ?? "live:"}${channel}`;
}

export function xaddArguments(
	key: string,
	publication: LivePublication,
): ReadonlyArray<string> {
	return [
		key,
		"MAXLEN",
		"~",
		String(LIVE_REPLAY_DEPTH),
		"*",
		MESSAGE_FIELD,
		encodePublication(publication),
	];
}

/** An entry whose fields do not hold a publication is dropped: a poisoned entry never stops the reader. */
function toMessage(
	entry: readonly [string, ReadonlyArray<string>],
): ReadonlyArray<LiveMessage> {
	const [seq, fields] = entry;
	const json = fields[fields.indexOf(MESSAGE_FIELD) + 1];
	return Option.match(decodePublication(json), {
		onNone: () => [],
		onSome: (publication) => [{ ...publication, seq }],
	});
}

export function messagesOfEntries(
	entries: unknown,
): ReadonlyArray<LiveMessage> {
	return Option.getOrElse(decodeEntries(entries), () => []).flatMap(toMessage);
}

/** Each stream key with the messages a read brought, in stream order. */
export function messagesOfRead(
	reply: unknown,
): ReadonlyArray<readonly [string, ReadonlyArray<LiveMessage>]> {
	return Object.entries(Option.getOrNull(decodeRead(reply)) ?? {}).map(
		([key, entries]) => [key, entries.flatMap(toMessage)],
	);
}

/** Appends each publication to its channel's stream (`XADD`, capped). */
export function makeRedisLivePublisher(
	redis: Pick<Redis.Redis["Service"], "send">,
	options: RedisLiveOptions = {},
): LivePublisher["Service"] {
	return LivePublisher.of({
		publish: (publication) =>
			redis
				.send(
					"XADD",
					...xaddArguments(
						liveStreamKey(publication.channel, options),
						publication,
					),
				)
				.pipe(
					Effect.mapError(
						(error) =>
							new LivePublishError({
								message: `XADD failed: ${String(error.cause)}`,
							}),
					),
					Effect.asVoid,
				),
	});
}

/** What the stream still holds after `seq`; nothing when Redis is out of reach, and the page reads on from now. */
export function makeRedisLiveLog(
	redis: Pick<Redis.Redis["Service"], "send">,
	options: RedisLiveOptions = {},
): LiveLog["Service"] {
	return LiveLog.of({
		since: (channel, seq) =>
			redis
				.send(
					"XRANGE",
					liveStreamKey(channel, options),
					`(${seq}`,
					"+",
					"COUNT",
					String(LIVE_REPLAY_DEPTH),
				)
				.pipe(
					Effect.map(messagesOfEntries),
					Effect.catch((error) =>
						Effect.as(
							Effect.logWarning(`[live] replay of ${channel} failed`, error),
							[],
						),
					),
				),
	});
}

/** `LivePublisher` and `LiveLog` over the process's shared `Redis`. */
export function redisLiveBusLayer(
	options: RedisLiveOptions = {},
): Layer.Layer<LivePublisher | LiveLog, never, Redis.Redis> {
	return Layer.mergeAll(
		Layer.effect(
			LivePublisher,
			Redis.Redis.useSync((redis) => makeRedisLivePublisher(redis, options)),
		),
		Layer.effect(
			LiveLog,
			Redis.Redis.useSync((redis) => makeRedisLiveLog(redis, options)),
		),
	);
}

export interface RedisLiveReaderOptions<E, R> extends RedisLiveOptions {
	readonly hub: LiveSocketHub;
	/** The channels whose streams this process reads: every channel a page may open on it. */
	readonly channels: ReadonlyArray<string>;
	/**
	 * Opens a connection of the reader's own, closed with its scope. A blocked
	 * `XREAD` holds its connection, so never hand it the shared one. The reader
	 * opens another after a drop: turn the client's own reconnection off.
	 */
	readonly connect: Effect.Effect<
		Pick<Redis.Redis["Service"], "send">,
		E,
		R | Scope.Scope
	>;
	/** The pause before reading again after a drop. Defaults to 1 second. */
	readonly rereadDelay?: Duration.Input;
}

class ReaderEnded extends Schema.TaggedError<ReaderEnded>()("ReaderEnded", {
	reason: Schema.String,
}) {}

/**
 * The process's reader: one blocking connection reads every channel's stream
 * and hands each message to the hub. The cursor outlives a dropped
 * connection, so the next one resumes where the last one stopped. Run it in
 * every process that holds sockets.
 */
export function redisLiveReaderLayer<E, R>(
	options: RedisLiveReaderOptions<E, R>,
): Layer.Layer<never, never, Exclude<R, Scope.Scope>> {
	const { hub, channels } = options;
	const rereadDelay = options.rereadDelay ?? "1 second";
	const keys = channels.map((channel) => liveStreamKey(channel, options));
	return Layer.effectDiscard(
		Effect.gen(function* () {
			if (keys.length === 0) {
				return;
			}
			const cursor = new Map(keys.map((key) => [key, "$"]));

			function deliverRead(reply: unknown): void {
				for (const [key, messages] of messagesOfRead(reply)) {
					for (const message of messages) {
						cursor.set(key, message.seq);
						hub.deliver(message);
					}
				}
			}

			const reading = Effect.gen(function* () {
				const connection = yield* options.connect.pipe(
					Effect.mapError(
						(error) => new ReaderEnded({ reason: String(error) }),
					),
				);
				const send = (command: string, ...args: ReadonlyArray<string>) =>
					connection
						.send<unknown>(command, ...args)
						.pipe(
							Effect.mapError(
								(error) => new ReaderEnded({ reason: String(error.cause) }),
							),
						);
				yield* send("CLIENT", "SETNAME", LIVE_READER_CLIENT_NAME);
				// Suspended, so each read asks from where the last one stopped.
				const readOnce = Effect.suspend(() =>
					send(
						"XREAD",
						"COUNT",
						String(READ_COUNT),
						"BLOCK",
						String(BLOCK_MILLISECONDS),
						"STREAMS",
						...keys,
						...keys.map((key) => cursor.get(key) ?? "$"),
					),
				).pipe(Effect.map(deliverRead));
				return yield* Effect.forever(readOnce);
			}).pipe(Effect.scoped);

			yield* reading.pipe(
				Effect.tapError((error) =>
					Effect.logWarning(`[live] reader ${error.reason}; reading again`),
				),
				Effect.retry({ schedule: Schedule.spaced(rereadDelay) }),
				Effect.forkScoped,
			);
		}),
	);
}

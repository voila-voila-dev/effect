import { describe, expect, it, setDefaultTimeout } from "bun:test";
import { RedisClient } from "bun";
import { DateTime, Effect, Layer } from "effect";
import { Redis } from "effect/persistence";
import { LivePublisher } from "../bus/live-publisher.ts";
import { LiveChannelName } from "../message/live-channel-name.ts";
import type { LivePublication } from "../message/live-message.ts";
import { LiveSocketHub } from "../socket/live-socket-hub.ts";
import {
	LIVE_READER_CLIENT_NAME,
	makeRedisLiveLog,
	redisLiveBusLayer,
	redisLiveReaderLayer,
} from "./redis-live-bus.ts";

// Skipped when REDIS_URL is unset, so `bun run test` passes without Redis.
const redisUrl = process.env.REDIS_URL;

const board = LiveChannelName.make("board");
const MESSAGES = 1000;
const BEFORE_THE_DROP = 600;

function publication(index: number): LivePublication {
	return {
		channel: board,
		subjectType: "order",
		subjectId: `o-${index}`,
		kind: "order.placed",
		at: DateTime.makeUnsafe("2026-10-14T09:30:00Z"),
		attributes: {},
	};
}

/** A `Redis` over one Bun client of its own, closed with the scope. */
function bunRedis(url: string) {
	return Effect.gen(function* () {
		const client = yield* Effect.acquireRelease(
			Effect.sync(() => new RedisClient(url, { autoReconnect: false })),
			(opened) => Effect.sync(() => opened.close()),
		);
		return yield* Redis.make({
			send: <A>(command: string, ...args: ReadonlyArray<string>) =>
				Effect.tryPromise({
					try: () => client.send(command, [...args]) as Promise<A>,
					catch: (cause) => new Redis.RedisError({ cause }),
				}),
			subscribe: () => Effect.die("no pub/sub in these tests"),
		});
	});
}

function eventually(condition: () => boolean, timeoutMilliseconds: number) {
	return Effect.promise(async () => {
		const deadline = Date.now() + timeoutMilliseconds;
		while (!condition() && Date.now() < deadline) {
			await Bun.sleep(50);
		}
	});
}

/** Closes the reader's connection as a network cut would, and no other. */
async function dropTheReader(url: string) {
	const admin = new RedisClient(url);
	const clients = String(await admin.send("CLIENT", ["LIST"]));
	const readerIds = clients
		.split("\n")
		.filter((line) => line.includes(` name=${LIVE_READER_CLIENT_NAME} `))
		.map((line) => /\bid=(\d+)/u.exec(line)?.[1] ?? "");
	for (const id of readerIds) {
		await admin.send("CLIENT", ["KILL", "ID", id]);
	}
	admin.close();
	expect(readerIds.length).toBe(1);
}

describe.skipIf(redisUrl === undefined)("the Redis live bus", () => {
	setDefaultTimeout(30_000);

	it("delivers 1,000 messages in order across a dropped reader, and replays after a seq", async () => {
		const url = redisUrl ?? "";
		// A fresh prefix per run, so earlier runs' streams stay out of it.
		const options = { prefix: `live-test:${crypto.randomUUID()}:` };
		const hub = new LiveSocketHub();
		const received: Array<{
			readonly subjectId: string;
			readonly seq: string;
		}> = [];
		hub.add(
			board,
			{ send: (data) => received.push(...JSON.parse(data).messages) },
			() => true,
		);
		const bus = Layer.mergeAll(
			redisLiveBusLayer(options),
			redisLiveReaderLayer({
				...options,
				hub,
				channels: [board],
				connect: bunRedis(url),
				rereadDelay: "100 millis",
			}),
		).pipe(Layer.provideMerge(Layer.effect(Redis.Redis, bunRedis(url))));

		await Effect.runPromise(
			Effect.gen(function* () {
				const publisher = yield* LivePublisher;
				function publishRange(from: number, to: number) {
					return Effect.forEach(
						Array.from({ length: to - from }, (_, offset) => from + offset),
						(index) => publisher.publish(publication(index)),
						{ discard: true },
					);
				}

				// The reader starts at the stream's end: let its first read block before publishing.
				yield* Effect.sleep("300 millis");
				yield* publishRange(0, BEFORE_THE_DROP);
				yield* eventually(() => received.length >= BEFORE_THE_DROP, 5000);
				yield* Effect.promise(() => dropTheReader(url));
				yield* publishRange(BEFORE_THE_DROP, MESSAGES);
				yield* eventually(() => received.length >= MESSAGES, 10_000);

				const replayed = yield* makeRedisLiveLog(
					yield* Redis.Redis,
					options,
				).since(board, received[BEFORE_THE_DROP - 1]?.seq ?? "0");

				expect(received.map((message) => message.subjectId)).toEqual(
					Array.from({ length: MESSAGES }, (_, index) => `o-${index}`),
				);
				expect(replayed.map((message) => message.subjectId)).toEqual(
					received.slice(BEFORE_THE_DROP).map((message) => message.subjectId),
				);
			}).pipe(Effect.provide(bus), Effect.scoped),
		);
	});
});

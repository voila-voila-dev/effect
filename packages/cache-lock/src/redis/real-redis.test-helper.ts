import { RedisClient } from "bun";
import { Effect, Layer } from "effect";
import { Redis } from "effect/persistence";

/**
 * The server the integration tests run against. They are skipped when it is
 * unset, so `bun run test` passes on a machine without Redis.
 */
export const REDIS_URL = process.env.REDIS_URL;

/**
 * A `Redis` over Bun's built-in client, scoped to the layer. Each test run
 * prefixes its keys with a fresh id so runs never see each other's counters.
 */
export function realRedisLayer(url: string): Layer.Layer<Redis.Redis> {
	return Layer.effect(
		Redis.Redis,
		Effect.gen(function* () {
			const client = yield* Effect.acquireRelease(
				Effect.sync(() => new RedisClient(url)),
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
		}),
	);
}

export const runPrefix = () => `cache-lock-test:${crypto.randomUUID()}:`;

import { Effect, Layer } from "effect";
import { Redis } from "effect/persistence";
import { CacheMissError } from "../cache/cache-miss-error.ts";
import { CacheTransportError } from "../cache/cache-transport-error.ts";
import { KeyValueCache } from "../cache/key-value-cache.ts";

export interface RedisKeyValueCacheOptions {
	/**
	 * Put in front of every key, so several applications or environments can
	 * share one server. Defaults to `"cache:"`.
	 */
	readonly prefix?: string;
}

// INCR creates the key without a TTL, so the first increment of a window sets
// one; later ones must not, or a busy window would push its own expiry out and
// never reset. One script keeps the two steps atomic: a crash between them
// would leave a counter that never expires.
const incrementScript = Redis.script(
	(key: string, ttlSeconds: number) => [key, ttlSeconds],
	{
		numberOfKeys: 1,
		lua: `local total = redis.call("INCR", KEYS[1])
if total == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end
return total`,
	},
).withReturnType<number>();

/** `KeyValueCache` over any `Redis` client; the layer is the usual entry. */
export function makeRedisKeyValueCache(
	redis: Redis.Redis["Service"],
	options: RedisKeyValueCacheOptions = {},
): KeyValueCache["Service"] {
	const prefix = options.prefix ?? "cache:";
	const increment = redis.eval(incrementScript);
	const transport = (key: string, verb: string) => (error: Redis.RedisError) =>
		new CacheTransportError({ key, reason: `${verb} failed: ${error.cause}` });

	return KeyValueCache.of({
		get: (key) =>
			redis.send<string | null>("GET", `${prefix}${key}`).pipe(
				Effect.mapError(transport(key, "get")),
				Effect.flatMap((value) =>
					value === null
						? Effect.fail(new CacheMissError({ key }))
						: Effect.succeed(value),
				),
			),

		set: (key, value, ttlSeconds) =>
			redis
				.send("SET", `${prefix}${key}`, value, "EX", String(ttlSeconds))
				.pipe(Effect.mapError(transport(key, "set")), Effect.asVoid),

		increment: (key, ttlSeconds) =>
			increment(`${prefix}${key}`, ttlSeconds).pipe(
				Effect.mapError(transport(key, "increment")),
			),

		delete: (key) =>
			redis
				.send("DEL", `${prefix}${key}`)
				.pipe(Effect.mapError(transport(key, "delete")), Effect.asVoid),
	});
}

/** `KeyValueCache` on the `Redis` service the application provides. */
export const redisKeyValueCacheLayer = (
	options: RedisKeyValueCacheOptions = {},
): Layer.Layer<KeyValueCache, never, Redis.Redis> =>
	Layer.effect(
		KeyValueCache,
		Redis.Redis.useSync((redis) => makeRedisKeyValueCache(redis, options)),
	);

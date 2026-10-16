import { Layer } from "effect";
import { RateLimiter as Limiter, type Redis } from "effect/persistence";
import type { RateLimiter } from "../rate-limit/rate-limiter.ts";
import { rateLimiterFromStoreLayer } from "../store/rate-limiter-from-store.ts";

export interface RedisRateLimiterOptions {
	/** Put in front of every key. Defaults to `"rate-limit:"`. */
	readonly prefix?: string;
}

/**
 * `RateLimiter` counted on the `Redis` service the application provides, so
 * every instance shares one count per key.
 */
export const redisRateLimiterLayer = (
	options: RedisRateLimiterOptions = {},
): Layer.Layer<RateLimiter, never, Redis.Redis> =>
	rateLimiterFromStoreLayer.pipe(
		Layer.provide(
			Limiter.layerStoreRedis({ prefix: options.prefix ?? "rate-limit:" }),
		),
	);

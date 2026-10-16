import { Duration, Effect, Layer } from "effect";
import { RateLimiter as Limiter } from "effect/persistence";
import { RateLimitedError } from "../rate-limit/rate-limited-error.ts";
import { RateLimiter } from "../rate-limit/rate-limiter.ts";
import { RateLimiterUnavailableError } from "../rate-limit/rate-limiter-unavailable-error.ts";

/**
 * `RateLimiter` over Effect's own limiter, translated to this package's two
 * errors. Counting lives in its `RateLimiterStore` — one Lua script per call
 * on Redis, so the count is atomic across instances — which makes this layer
 * the single place both the in-memory and the Redis limiter go through, and
 * the way to plug any other store.
 */
export const rateLimiterFromStoreLayer: Layer.Layer<
	RateLimiter,
	never,
	Limiter.RateLimiterStore
> = Layer.effect(
	RateLimiter,
	Effect.map(Limiter.make, (limiter) =>
		RateLimiter.of({
			consume: ({ key, limit, windowSeconds }) =>
				limiter
					.consume({
						key,
						limit,
						window: Duration.seconds(windowSeconds),
						algorithm: "fixed-window",
						onExceeded: "fail",
					})
					.pipe(
						Effect.asVoid,
						Effect.mapError(({ reason }) =>
							reason._tag === "RateLimitExceeded"
								? new RateLimitedError({
										key,
										retryAfterSeconds: Math.max(
											1,
											Math.ceil(Duration.toSeconds(reason.retryAfter)),
										),
									})
								: new RateLimiterUnavailableError({
										key,
										windowSeconds,
										reason: reason.message,
									}),
						),
					),
		}),
	),
);

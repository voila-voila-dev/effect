import { Effect, Layer } from "effect";
import { RateLimiter as Limiter } from "effect/persistence";
import { RateLimiter } from "../rate-limit/rate-limiter.ts";
import { rateLimiterFromStoreLayer } from "./rate-limiter-from-store.ts";

const unreachable = new Limiter.RateLimiterError({
	reason: new Limiter.RateLimitStoreError({ message: "unreachable" }),
});

/** A limiter whose store is down on every call, standing in for an outage. */
export const unreachableRateLimiterLayer: Layer.Layer<RateLimiter> =
	rateLimiterFromStoreLayer.pipe(
		Layer.provide(
			Layer.succeed(Limiter.RateLimiterStore, {
				fixedWindow: () => Effect.fail(unreachable),
				tokenBucket: () => Effect.fail(unreachable),
				adaptiveConsume: () => Effect.fail(unreachable),
				adaptiveFeedback: () => Effect.fail(unreachable),
			}),
		),
	);

export const runWith = <A, E>(
	layer: Layer.Layer<RateLimiter>,
	use: (limiter: RateLimiter["Service"]) => Effect.Effect<A, E>,
) => Effect.runPromiseExit(RateLimiter.use(use).pipe(Effect.provide(layer)));

/** The typed failure of an exit, for `toMatchObject`. */
export const failureOf = (error: object) => ({
	_tag: "Failure",
	cause: { reasons: [{ error }] },
});

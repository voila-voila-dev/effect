import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { RateLimiter } from "../rate-limit/rate-limiter.ts";
import {
	REDIS_URL,
	realRedisLayer,
	runPrefix,
} from "./real-redis.test-helper.ts";
import { redisRateLimiterLayer } from "./redis-rate-limiter.ts";

// The counting is Effect's own Lua script, so there is nothing to test here
// without a server: only that the layer wires it to Redis under the prefix.
describe.skipIf(REDIS_URL === undefined)(
	"redisRateLimiterLayer on a real Redis",
	() => {
		it("admits `limit` calls per window across limiter instances", async () => {
			const prefix = runPrefix();
			const consume = RateLimiter.use((limiter) =>
				limiter.consume({ key: "k", limit: 2, windowSeconds: 60 }),
			).pipe(
				Effect.provide(redisRateLimiterLayer({ prefix })),
				Effect.provide(realRedisLayer(REDIS_URL ?? "")),
			);
			const exits = await Promise.all(
				[1, 2, 3].map(() => Effect.runPromiseExit(consume)),
			);
			expect(exits.filter(Exit.isFailure)).toHaveLength(1);
		});
	},
);

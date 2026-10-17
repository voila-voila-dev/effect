import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { inMemoryRateLimiterLayer } from "./in-memory-rate-limiter.ts";
import { failureOf, runWith } from "./rate-limiter.test-helper.ts";

describe("inMemoryRateLimiterLayer", () => {
	it("admits `limit` calls per window, then fails with the window's remainder", async () => {
		const exit = await runWith(inMemoryRateLimiterLayer, (limiter) =>
			Effect.forEach([1, 2, 3], () =>
				limiter.consume({ key: "login:someone", limit: 2, windowSeconds: 900 }),
			),
		);
		expect(exit).toMatchObject(
			failureOf({
				_tag: "RateLimitedError",
				key: "login:someone",
				retryAfterSeconds: 900,
			}),
		);
	});

	it("counts each key on its own", async () => {
		const exit = await runWith(inMemoryRateLimiterLayer, (limiter) =>
			Effect.forEach(["a", "b"], (key) =>
				limiter.consume({ key, limit: 1, windowSeconds: 60 }),
			),
		);
		expect(Exit.isSuccess(exit)).toBe(true);
	});
});

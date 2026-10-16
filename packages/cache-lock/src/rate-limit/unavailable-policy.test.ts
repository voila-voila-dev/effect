import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { inMemoryRateLimiterLayer } from "./in-memory-rate-limiter.ts";
import {
	failureOf,
	runWith,
	unreachableRateLimiterLayer,
} from "./rate-limiter.test-helper.ts";
import {
	allowWhenUnavailable,
	denyWhenUnavailable,
} from "./unavailable-policy.ts";

const rateLimit = { key: "k", limit: 1, windowSeconds: 900 };

describe("allowWhenUnavailable", () => {
	it("lets the call through when the store is down", async () => {
		const exit = await runWith(unreachableRateLimiterLayer, (limiter) =>
			allowWhenUnavailable(limiter.consume(rateLimit)),
		);
		expect(Exit.isSuccess(exit)).toBe(true);
	});

	it("still refuses a call over the limit", async () => {
		const exit = await runWith(inMemoryRateLimiterLayer, (limiter) =>
			Effect.forEach([1, 2], () =>
				allowWhenUnavailable(limiter.consume(rateLimit)),
			),
		);
		expect(exit).toMatchObject(failureOf({ _tag: "RateLimitedError" }));
	});
});

describe("denyWhenUnavailable", () => {
	it("refuses the call for one window when the store is down", async () => {
		const exit = await runWith(unreachableRateLimiterLayer, (limiter) =>
			denyWhenUnavailable(limiter.consume(rateLimit)),
		);
		expect(exit).toMatchObject(
			failureOf({
				_tag: "RateLimitedError",
				key: "k",
				retryAfterSeconds: 900,
			}),
		);
	});
});

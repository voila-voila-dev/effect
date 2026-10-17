import { describe, expect, it } from "bun:test";
import {
	failureOf,
	runWith,
	unreachableRateLimiterLayer,
} from "./rate-limiter.test-helper.ts";

describe("rateLimiterFromStoreLayer", () => {
	it("turns a store failure into RateLimiterUnavailableError, carrying the window", async () => {
		const exit = await runWith(unreachableRateLimiterLayer, (limiter) =>
			limiter.consume({ key: "k", limit: 3, windowSeconds: 900 }),
		);
		expect(exit).toMatchObject(
			failureOf({
				_tag: "RateLimiterUnavailableError",
				key: "k",
				windowSeconds: 900,
				reason: "unreachable",
			}),
		);
	});
});

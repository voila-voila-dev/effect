import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { RetryPolicy } from "./retry-policy.ts";
import { quickPolicy } from "./retry-test-policy.test-helper.ts";

describe("retryPolicy", () => {
	it("runs a failing effect once plus its attempts", async () => {
		let runs = 0;
		const failing = Effect.suspend(() => {
			runs += 1;
			return Effect.fail("down");
		});
		const policy = quickPolicy(3);

		await Effect.runPromiseExit(
			Effect.retry(failing, {
				schedule: policy.schedule,
				times: policy.attempts,
			}),
		);

		expect(runs).toBe(4);
	});

	it("backs off longer for a rate limit than for a blip", () => {
		expect(RetryPolicy.transient.attempts).toBe(2);
		expect(RetryPolicy.rateLimited.attempts).toBe(4);
	});
});

import { describe, expect, it } from "bun:test";
import { Duration } from "effect";
import { exponentialBackoff } from "./backoff.ts";

describe("exponentialBackoff", () => {
	it("starts at the base and doubles after each failure", () => {
		const backoff = exponentialBackoff();
		expect([1, 2, 3, 4].map((n) => Duration.toMillis(backoff(n)))).toEqual([
			1000, 2000, 4000, 8000,
		]);
	});

	it("stops growing at the cap", () => {
		const backoff = exponentialBackoff({
			base: "1 minute",
			factor: 10,
			max: "1 hour",
		});
		expect(Duration.toMillis(backoff(3))).toBe(Duration.toMillis("1 hour"));
	});
});

import { describe, expect, it } from "bun:test";
import { Effect, Metric } from "effect";
import { AccessDeniedError } from "../access-denied-error.ts";
import { unitMetrics, unitRuns } from "./unit-metrics.ts";

function runsOf(name: string, outcome: string): number {
	const counter = Metric.withAttributes(unitRuns, {
		kind: "job",
		name,
		outcome,
	});
	return Effect.runSync(Metric.value(counter)).count as number;
}

describe("unitMetrics", () => {
	it("counts each run by outcome, a refusal apart from a failure", () => {
		const { track } = unitMetrics("job", "metrics-test");
		Effect.runSync(track(Effect.void));
		Effect.runSync(Effect.ignore(track(Effect.fail("boom"))));
		Effect.runSync(Effect.ignore(track(Effect.fail(new AccessDeniedError()))));

		expect(runsOf("metrics-test", "ok")).toBe(1);
		expect(runsOf("metrics-test", "failed")).toBe(1);
		expect(runsOf("metrics-test", "denied")).toBe(1);
	});

	it("leaves the result untouched", () => {
		const { track } = unitMetrics("job", "metrics-result");
		expect(Effect.runSync(track(Effect.succeed(42)))).toBe(42);
	});
});

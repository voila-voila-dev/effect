import { describe, expect, it } from "bun:test";
import { unitRuns } from "@voila.dev/effect-ddd";
import { Cause, Duration, Effect, Metric } from "effect";
import { Job } from "./job.ts";

const noop = Job.make({
	name: "noop",
	every: "*/5 * * * *",
	run: Effect.succeed("nothing to do"),
});

describe("Job.make", () => {
	it("resolves to the summary its run returns", async () => {
		expect(await Effect.runPromise(noop.run)).toBe("nothing to do");
	});

	it("defaults the timeout to ten minutes", () => {
		expect(Duration.equals(noop.timeout, Duration.minutes(10))).toBe(true);
	});

	it("fails with a TimeoutError when the run outlives its timeout", async () => {
		const slow = Job.make({
			name: "slow",
			every: "* * * * *",
			timeout: "10 millis",
			run: Effect.never,
		});
		const error = await Effect.runPromise(Effect.flip(slow.run));
		expect(Cause.isTimeoutError(error)).toBe(true);
	});

	it("throws on a cron expression that does not parse, naming the job", () => {
		expect(() =>
			Job.make({
				name: "broken",
				every: "not a cron expression",
				run: Effect.succeed("never runs"),
			}),
		).toThrow(/broken/u);
	});

	it("reports each run as a job unit", async () => {
		const counted = Job.make({
			name: "job-metrics",
			every: "* * * * *",
			run: Effect.succeed("done"),
		});
		await Effect.runPromise(counted.run);
		const counter = Metric.withAttributes(unitRuns, {
			kind: "job",
			name: "job-metrics",
			outcome: "ok",
		});
		expect(Effect.runSync(Metric.value(counter)).count).toBe(1);
	});
});

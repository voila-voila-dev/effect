import { describe, expect, it } from "bun:test";
import { Effect, Exit, Fiber } from "effect";
import { TestClock } from "effect/testing";
import { Job } from "./job.ts";
import { runJob, scheduleJob } from "./schedule-job.ts";

describe("runJob", () => {
	it("swallows a failed tick so the schedule goes on", async () => {
		const broken = Job.make({
			name: "run-job-broken",
			every: "* * * * *",
			run: Effect.fail("boom"),
		});
		const exit = await Effect.runPromise(Effect.exit(runJob(broken)));
		expect(Exit.isSuccess(exit)).toBe(true);
	});
});

describe("scheduleJob", () => {
	it("runs on the cron, not at start, and goes on after a failure", async () => {
		const ticks: Array<number> = [];
		const everyMinute = Job.make({
			name: "schedule-every-minute",
			every: "* * * * *",
			run: Effect.suspend(() => {
				ticks.push(ticks.length + 1);
				return ticks.length === 1
					? Effect.fail("first tick breaks")
					: Effect.succeed("ok");
			}),
		});

		await Effect.gen(function* () {
			const fiber = yield* Effect.forkChild(scheduleJob(everyMinute));
			yield* TestClock.adjust("30 seconds");
			const atStart = ticks.length;
			yield* TestClock.adjust("1 minute");
			yield* TestClock.adjust("1 minute");
			yield* Fiber.interrupt(fiber);
			expect(atStart).toBe(0);
		}).pipe(Effect.provide(TestClock.layer()), Effect.runPromise);

		expect(ticks).toEqual([1, 2]);
	});
});

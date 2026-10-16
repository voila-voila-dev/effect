import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { Job } from "./job.ts";
import { Jobs } from "./jobs.ts";

const noop = Job.make({
	name: "noop",
	every: "*/5 * * * *",
	run: Effect.succeed("nothing to do"),
});

describe("Jobs.of", () => {
	const registry = Jobs.of([noop]);

	it("finds a job by name", () => {
		expect(registry.byName("noop")).toBe(noop);
		expect(registry.byName("absent")).toBeUndefined();
	});

	it("refuses two jobs sharing a name, naming it", () => {
		expect(() => Jobs.of([noop, noop])).toThrow(/noop/u);
	});
});

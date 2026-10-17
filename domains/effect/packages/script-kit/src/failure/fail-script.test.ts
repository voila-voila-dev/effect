import { describe, expect, it } from "bun:test";
import { Effect, Exit } from "effect";
import { failScript } from "./fail-script.ts";
import { ScriptFailure } from "./script-failure.ts";

describe("failScript", () => {
	it("fails with a ScriptFailure carrying the message", () => {
		const exit = Effect.runSyncExit(failScript("2 files are stale"));
		expect(exit).toStrictEqual(
			Exit.fail(new ScriptFailure({ message: "2 files are stale" })),
		);
	});

	it("prints the details only when the effect runs", () => {
		const printed: unknown[] = [];
		const original = console.error;
		console.error = (...values: unknown[]) => printed.push(...values);
		try {
			const program = failScript("stale", "a.ts\nb.ts");
			expect(printed).toStrictEqual([]);
			Effect.runSyncExit(program);
			expect(printed).toStrictEqual(["a.ts\nb.ts"]);
		} finally {
			console.error = original;
		}
	});
});

import { expect, it } from "bun:test";
import { Effect } from "effect";
import { saveCounting } from "./save-counting.ts";

it("counts successes and failures without failing", () => {
	const summary = { saved: 0, failed: 0 };
	const original = console.error;
	console.error = () => {};
	try {
		Effect.runSync(saveCounting(Effect.succeed(1), summary, "a"));
		const result = Effect.runSync(
			saveCounting(Effect.fail("boom"), summary, "b"),
		);
		expect(result).toBeUndefined();
	} finally {
		console.error = original;
	}
	expect(summary).toStrictEqual({ saved: 1, failed: 1 });
});

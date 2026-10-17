import { describe, expect, it } from "bun:test";
import { BunServices } from "@effect/platform-bun";
import { Effect } from "effect";
import { Command } from "effect/cli";
import { commitFlag } from "./commit-flag.ts";
import { limitFlag } from "./limit-flag.ts";

const parsed = (args: ReadonlyArray<string>) =>
	Effect.runPromise(
		Effect.gen(function* () {
			let seen: { commit: boolean; limit: number } | undefined;
			const command = Command.make(
				"probe",
				{ commit: commitFlag, limit: limitFlag },
				(input) =>
					Effect.sync(() => {
						seen = input;
					}),
			);
			yield* Command.runWith(command, { version: "0" })(args);
			return seen;
		}).pipe(Effect.provide(BunServices.layer)),
	);

describe("standard flags", () => {
	it("is a dry run with no limit when no flag is passed", async () => {
		expect(await parsed([])).toStrictEqual({
			commit: false,
			limit: Number.POSITIVE_INFINITY,
		});
	});

	it("commits and caps when asked", async () => {
		expect(await parsed(["--commit", "--limit", "5"])).toStrictEqual({
			commit: true,
			limit: 5,
		});
	});
});

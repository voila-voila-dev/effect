import { describe, expect, it } from "bun:test";
import { BunServices } from "@effect/platform-bun";
import { Effect, Exit } from "effect";
import { CommandFailure } from "./command-failure.ts";
import { commandText } from "./command-text.ts";

const run = <A, E>(
	program: Effect.Effect<A, E, BunServices.BunServices>,
): Promise<Exit.Exit<A, E>> =>
	Effect.runPromiseExit(program.pipe(Effect.provide(BunServices.layer)));

describe("commandText", () => {
	it("returns the trimmed stdout", async () => {
		expect(await run(commandText("echo", ["  hello  "]))).toStrictEqual(
			Exit.succeed("hello"),
		);
	});

	it("fails with the command line when the exit code is not 0", async () => {
		expect(await run(commandText("sh", ["-c", "exit 3"]))).toStrictEqual(
			Exit.fail(
				new CommandFailure({ message: "`sh -c exit 3` exited with 3" }),
			),
		);
	});
});

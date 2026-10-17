import { Console, Effect } from "effect";
import { spawnForeground } from "./spawn-foreground.ts";

/** Runs a one-shot command (a migration, a build) in the foreground; a non-zero exit fails the effect. */
export function runStep(
	label: string,
	command: ReadonlyArray<string>,
	cwd: string,
): Effect.Effect<void, Error> {
	return Console.log(`\n${label}...`).pipe(
		Effect.andThen(spawnForeground(command, { cwd })),
		Effect.flatMap((exitCode) =>
			exitCode === 0
				? Effect.void
				: Effect.fail(new Error(`${label} failed (exit code ${exitCode}).`)),
		),
	);
}

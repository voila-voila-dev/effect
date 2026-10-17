import { Effect, Stream } from "effect";
import type { PlatformError } from "effect/PlatformError";
import { ChildProcess } from "effect/process";
import type { ChildProcessSpawner } from "effect/process/ChildProcessSpawner";
import { CommandFailure } from "./command-failure.ts";

/**
 * Runs a subprocess through Effect's executor and returns its trimmed stdout,
 * in place of `execFileSync`. stdout is drained before the exit code is
 * awaited: a process filling its pipe would otherwise wait forever for a
 * reader that is itself waiting for the exit.
 */
export function commandText(
	command: string,
	args: ReadonlyArray<string>,
	options?: { readonly cwd?: string },
): Effect.Effect<string, PlatformError | CommandFailure, ChildProcessSpawner> {
	return Effect.gen(function* () {
		const handle = yield* ChildProcess.make(
			command,
			args,
			options?.cwd === undefined ? {} : { cwd: options.cwd },
		);
		const output = yield* handle.stdout.pipe(
			Stream.decodeText(),
			Stream.mkString,
		);
		const exitCode = yield* handle.exitCode;
		if (exitCode !== 0) {
			return yield* new CommandFailure({
				message: `\`${command} ${args.join(" ")}\` exited with ${exitCode}`,
			});
		}
		return output.trim();
	}).pipe(Effect.scoped);
}

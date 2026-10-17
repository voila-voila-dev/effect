import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { Command } from "effect/cli";
import {
	DEFAULT_SCRIPT_ENVIRONMENT_FILES,
	scriptEnvironmentLayer,
} from "./script-environment.ts";

export interface RunScriptOptions {
	/** Shown by `--version`. */
	readonly version?: string;
	/** Env files to load, relative to the repository root, earliest wins. */
	readonly environmentFiles?: ReadonlyArray<string>;
}

/**
 * The one entrypoint a script ends with: parses argv through the command
 * (typed flags, `--help` and `--version` for free), loads the env files, and
 * hands the program to `BunRuntime.runMain`, which renders failures and owns
 * the exit code. No bare `Effect.runPromise`, no `process.exit`.
 */
export function runScript<Name extends string, Input, ContextInput, E>(
	command: Command.Command<Name, Input, ContextInput, E, Command.Environment>,
	options?: RunScriptOptions,
): void {
	BunRuntime.runMain(
		Command.run(command, { version: options?.version ?? "1.0.0" }).pipe(
			Effect.provide(
				Layer.mergeAll(
					BunServices.layer,
					scriptEnvironmentLayer(
						options?.environmentFiles ?? DEFAULT_SCRIPT_ENVIRONMENT_FILES,
					),
				),
			),
		),
	);
}

/**
 * A `runScript` with a repository's own options baked in, so every script of
 * that repository loads the same env files without repeating them.
 */
export function makeRunScript(defaults: RunScriptOptions): typeof runScript {
	return (command, options) => runScript(command, { ...defaults, ...options });
}

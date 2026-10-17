import { loadEnvironmentFiles } from "@voila.dev/env";
import { Effect, Layer } from "effect";
import { resolveFromRepositoryRoot } from "./repository-root.ts";

/**
 * The env files a script loads by default, relative to the repository root.
 * Earliest wins, so the git-ignored local secrets shadow the committed
 * defaults, and a variable exported by CI beats both.
 */
export const DEFAULT_SCRIPT_ENVIRONMENT_FILES: ReadonlyArray<string> = [
	".env.local",
	".env.development",
	".env",
];

/**
 * Loads env files, relative to the repository root, into `process.env`.
 * Built into `runScript`, and usable on its own by a script that reads env
 * before its command runs.
 */
export function scriptEnvironmentLayer(
	files: ReadonlyArray<string> = DEFAULT_SCRIPT_ENVIRONMENT_FILES,
): Layer.Layer<never> {
	return Layer.effectDiscard(
		Effect.sync(() => {
			loadEnvironmentFiles(
				files.map((file) => resolveFromRepositoryRoot(file)),
			);
		}),
	);
}

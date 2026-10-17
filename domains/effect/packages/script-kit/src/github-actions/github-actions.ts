import { appendFileSync } from "node:fs";
import { Effect } from "effect";

/**
 * What a script run as a GitHub Actions step needs beyond `failScript`: mask
 * a secret in the job log, emit a warning annotation, write step outputs.
 */

/** Keeps a credential-bearing value out of every later log line. */
export function mask(value: string): void {
	console.log(`::add-mask::${value}`);
}

export function warn(message: string): void {
	console.log(`::warning::${message}`);
}

/** Appends `key=value` lines to `GITHUB_OUTPUT`; dies when the step has none. */
export function setOutputs(
	outputs: Record<string, string>,
): Effect.Effect<void> {
	return Effect.sync(() => {
		const path = process.env.GITHUB_OUTPUT;
		if (path === undefined) {
			throw new Error("GITHUB_OUTPUT is unset");
		}
		appendFileSync(
			path,
			Object.entries(outputs)
				.map(([key, value]) => `${key}=${value}\n`)
				.join(""),
		);
	});
}

import { Effect } from "effect";
import { ScriptFailure } from "./script-failure.ts";

/**
 * Reports a finding and fails. The details go to stderr first so CI shows the
 * findings above the one-line cause, which is all the renderer repeats.
 */
export function failScript(
	message: string,
	details?: string,
): Effect.Effect<never, ScriptFailure> {
	return Effect.suspend(() => {
		if (details !== undefined) {
			console.error(details);
		}
		return Effect.fail(new ScriptFailure({ message }));
	});
}

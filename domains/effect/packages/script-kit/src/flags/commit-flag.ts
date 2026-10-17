import { Flag } from "effect/cli";

/**
 * Dry run by default: a script that writes anywhere takes `commitFlag` and
 * persists only when `--commit` is passed. Never invert it.
 */
export const commitFlag: Flag.Flag<boolean> = Flag.Boolean("commit").pipe(
	Flag.withDescription(
		"Persist the changes. Without it the script reports what it would do.",
	),
	// A boolean flag has no implicit default since Effect 4: left alone it is
	// required, and a script run without `--commit` would answer with its help
	// text instead of the dry run it promises.
	Flag.withDefault(false),
);

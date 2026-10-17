import { Flag } from "effect/cli";

/** `--limit=N` caps how many items a script processes; unbounded by default. */
export const limitFlag: Flag.Flag<number> = Flag.Int("limit").pipe(
	Flag.withDescription("Process at most this many items."),
	Flag.withDefault(Number.POSITIVE_INFINITY),
);

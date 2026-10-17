import { Effect } from "effect";

export interface SaveCounters {
	saved: number;
	failed: number;
}

/**
 * Saves one item without stopping a backfill: a success bumps `saved`, a
 * failure bumps `failed` and is logged, so one bad row never aborts the run.
 */
export function saveCounting<Value, Error, Requirements>(
	save: Effect.Effect<Value, Error, Requirements>,
	summary: SaveCounters,
	identifier: string,
): Effect.Effect<Value | undefined, never, Requirements> {
	return save.pipe(
		Effect.tap(() =>
			Effect.sync(() => {
				summary.saved += 1;
			}),
		),
		Effect.catch((error) =>
			Effect.sync(() => {
				summary.failed += 1;
				console.error(`  failed to save ${identifier}: ${error}`);
			}).pipe(Effect.as(undefined)),
		),
	);
}

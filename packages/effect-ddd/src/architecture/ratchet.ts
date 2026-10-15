/**
 * A baseline that may only shrink. `added` are the offenders the baseline does
 * not excuse: the build fails on them. `fixed` are baseline entries that no
 * longer offend: the build fails on them too, until they are removed, so the
 * baseline never quietly excuses a file that was fixed and broken again.
 */
export function ratchet(
	baseline: Iterable<string>,
	offenders: Iterable<string>,
): {
	readonly added: ReadonlyArray<string>;
	readonly fixed: ReadonlyArray<string>;
} {
	const excused = new Set(baseline);
	const current = new Set(offenders);
	return {
		added: [...current].filter((offender) => !excused.has(offender)).sort(),
		fixed: [...excused].filter((entry) => !current.has(entry)).sort(),
	};
}

import type { FilterOption } from "#/filter/types.ts";

/** What a select field shows right now, and whether the fold toggle is due. */
export type FoldedOptions = {
	readonly visible: ReadonlyArray<FilterOption>;
	/** Options hidden behind the toggle — the "N more…" count. */
	readonly foldedCount: number;
	/** Whether the toggle shows: something is folded, or the list is unfolded. */
	readonly foldable: boolean;
};

/**
 * Which options a select field shows. A search reaches every option, folded or
 * not — the fold only tames the browse view, never the lookup — and a selected
 * secondary option always shows, folded or not.
 */
export function foldOptions(
	options: ReadonlyArray<FilterOption>,
	selected: ReadonlyArray<string>,
	normalizedQuery: string,
	expanded: boolean,
): FoldedOptions {
	if (normalizedQuery !== "") {
		const matching = options.filter((option) =>
			option.label.toLowerCase().includes(normalizedQuery),
		);
		return { visible: matching, foldedCount: 0, foldable: false };
	}
	const visible = expanded
		? options
		: options.filter(
				(option) =>
					option.secondary !== true || selected.includes(option.value),
			);
	return {
		visible,
		foldedCount: options.length - visible.length,
		foldable: visible.length < options.length || expanded,
	};
}

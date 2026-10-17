import { useContext } from "react";
import {
	FilterContext,
	type FilterSettings,
} from "#/filter/context/filter-context.ts";
import type { FilterLabels } from "#/filter/types.ts";

/**
 * The nearest filter root's copy and locale with a part's own overrides on top
 * — for a leaf part (a chip row, a trigger) that renders no field and so needs
 * no provider of its own.
 */
export function useFilterSettings(
	labels: Partial<FilterLabels> | undefined,
	locale: string | undefined,
): FilterSettings {
	const inherited = useContext(FilterContext);
	return {
		labels:
			labels === undefined
				? inherited.labels
				: { ...inherited.labels, ...labels },
		locale: locale ?? inherited.locale,
	};
}

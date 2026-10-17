import { useContext } from "react";
import { FilterContext } from "#/filter/context/filter-context.ts";
import type { FilterLabels } from "#/filter/types.ts";

/** The strings of the nearest filter root, merged over `defaultFilterLabels`. */
export function useFilterLabels(): FilterLabels {
	return useContext(FilterContext).labels;
}

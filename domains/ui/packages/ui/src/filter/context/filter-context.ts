import { createContext } from "react";
import { defaultFilterLabels, type FilterLabels } from "#/filter/types.ts";

/**
 * The copy and locale every surface under one filter root shares. Provided once
 * where the screen declares its filters, so the trigger, chips, panel and each
 * field editor read the same strings instead of receiving them level by level.
 */
export type FilterSettings = {
	readonly labels: FilterLabels;
	readonly locale: string;
};

export const FilterContext = createContext<FilterSettings>({
	labels: defaultFilterLabels,
	locale: "en-US",
});

import { useContext } from "react";
import { FilterContext } from "#/filter/context/filter-context.ts";

/** The BCP 47 tag the nearest filter root formats numbers, money and dates in. */
export function useFilterLocale(): string {
	return useContext(FilterContext).locale;
}

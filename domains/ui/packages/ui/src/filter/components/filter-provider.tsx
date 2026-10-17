import type * as React from "react";
import { useContext, useMemo } from "react";
import {
	FilterContext,
	type FilterSettings,
} from "#/filter/context/filter-context.ts";
import type { FilterLabels } from "#/filter/types.ts";

interface Props {
	/**
	 * Overrides for the strings every part below shows, merged over the
	 * surrounding provider's (and, at the outermost level, over
	 * `defaultFilterLabels`), so a partial is enough.
	 */
	labels?: Partial<FilterLabels>;
	/** BCP 47 tag used to format numbers, money and dates; inherited when omitted. */
	locale?: string;
	children?: React.ReactNode;
}

/**
 * Sets the copy and locale once for every filter part below it. Each part also
 * takes `labels` and `locale` itself and wraps its content in one of these —
 * overrides merge over the surrounding provider, so a part that passes nothing
 * nested under a translated one inherits the translations instead of
 * resetting to English.
 */
export function FilterProvider({ labels, locale, children }: Props) {
	const parent = useContext(FilterContext);
	const value = useMemo<FilterSettings>(
		() => ({
			labels:
				labels === undefined ? parent.labels : { ...parent.labels, ...labels },
			locale: locale ?? parent.locale,
		}),
		[parent, labels, locale],
	);
	return (
		<FilterContext.Provider value={value}>{children}</FilterContext.Provider>
	);
}

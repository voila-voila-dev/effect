import type * as React from "react";
import { FilterFieldInput } from "#/filter/components/fields/filter-field-input.tsx";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";

/** Only long editors earn a field search: three filters are faster to read. */
export const SEARCHABLE_FROM_DEFINITIONS = 6;

interface Props
	extends Omit<React.ComponentProps<typeof FilterFieldInput>, "onChange"> {
	value: string;
	onValueChange: (query: string) => void;
}

/** The box at the top of a long editor that finds a filter by its name. */
export function FilterDefinitionSearch({
	value,
	onValueChange,
	...props
}: Props) {
	const labels = useFilterLabels();
	return (
		<FilterFieldInput
			type="search"
			data-slot="filter-definition-search"
			value={value}
			placeholder={labels.filterSearchPlaceholder}
			aria-label={labels.filterSearchPlaceholder}
			onChange={(event) => onValueChange(event.target.value)}
			{...props}
		/>
	);
}

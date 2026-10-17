import { useId } from "react";
import { DateBoundField } from "#/filter/components/fields/date-bound-field.tsx";
import { DatePresetRow } from "#/filter/components/fields/date-preset-row.tsx";
import { FilterFieldFrame } from "#/filter/components/fields/filter-field-frame.tsx";
import { FilterRangeRow } from "#/filter/components/fields/filter-range-row.tsx";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";
import type {
	DateRangeFilterDefinition,
	DateRangeFilterValue,
} from "#/filter/types.ts";

interface Props {
	definition: DateRangeFilterDefinition;
	value: DateRangeFilterValue | undefined;
	onValueChange: (value: DateRangeFilterValue) => void;
}

/**
 * A start and an end date, either of which may be left open, under the
 * definition's one-tap presets when it declares any.
 */
export function DateRangeFilterField({
	definition,
	value,
	onValueChange,
}: Props) {
	const labels = useFilterLabels();
	const controlId = useId();
	const isEmpty = value?.from === undefined && value?.to === undefined;

	return (
		<FilterFieldFrame
			label={definition.label}
			description={definition.description}
			controlId={controlId}
			onClear={isEmpty ? undefined : () => onValueChange({ kind: "dateRange" })}
		>
			{definition.presets !== undefined && (
				<DatePresetRow
					presets={definition.presets}
					value={value}
					onValueChange={onValueChange}
					aria-label={definition.label}
				/>
			)}
			<FilterRangeRow>
				<DateBoundField
					id={controlId}
					value={value?.from}
					placeholder={labels.from}
					min={definition.min}
					max={value?.to ?? definition.max}
					onValueChange={(from) =>
						onValueChange({ kind: "dateRange", from, to: value?.to })
					}
				/>
				<DateBoundField
					value={value?.to}
					placeholder={labels.to}
					min={value?.from ?? definition.min}
					max={definition.max}
					onValueChange={(to) =>
						onValueChange({ kind: "dateRange", from: value?.from, to })
					}
				/>
			</FilterRangeRow>
		</FilterFieldFrame>
	);
}

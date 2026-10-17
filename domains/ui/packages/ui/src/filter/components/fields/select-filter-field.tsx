import { useId, useState } from "react";
import { FilterFieldFrame } from "#/filter/components/fields/filter-field-frame.tsx";
import { FilterFieldInput } from "#/filter/components/fields/filter-field-input.tsx";
import { FilterOperatorToggle } from "#/filter/components/fields/filter-operator-toggle.tsx";
import { FoldToggle } from "#/filter/components/fields/fold-toggle.tsx";
import { OptionToggle } from "#/filter/components/fields/option-toggle.tsx";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";
import { foldOptions } from "#/filter/lib/fold-options.ts";
import type {
	SelectFilterDefinition,
	SelectFilterValue,
} from "#/filter/types.ts";

/** Past this many options the list gets its own search box. */
const SEARCHABLE_FROM = 8;

function toggleValue(
	values: ReadonlyArray<string>,
	value: string,
	multiple: boolean,
): ReadonlyArray<string> {
	if (values.includes(value)) {
		return values.filter((current) => current !== value);
	}
	return multiple ? [...values, value] : [value];
}

interface Props {
	definition: SelectFilterDefinition;
	value: SelectFilterValue | undefined;
	onValueChange: (value: SelectFilterValue) => void;
}

/**
 * Single or multiple choice among a known set, optionally inverted. Options
 * marked `secondary` wait behind a "more" toggle until asked for.
 */
export function SelectFilterField({ definition, value, onValueChange }: Props) {
	const labels = useFilterLabels();
	const searchId = useId();
	const [query, setQuery] = useState("");
	const [expanded, setExpanded] = useState(false);
	const selected = value?.values ?? [];
	const excluded = value?.excluded ?? false;
	const multiple = definition.multiple ?? false;

	const searchable = definition.options.length >= SEARCHABLE_FROM;
	const fold = foldOptions(
		definition.options,
		selected,
		query.trim().toLowerCase(),
		expanded,
	);

	return (
		<FilterFieldFrame
			label={definition.label}
			description={definition.description}
			controlId={searchable ? searchId : undefined}
			operator={
				definition.allowExclusion === true ? (
					<FilterOperatorToggle
						excluded={excluded}
						disabled={selected.length === 0}
						onExcludedChange={(next) =>
							onValueChange({
								kind: "select",
								values: selected,
								excluded: next,
							})
						}
					/>
				) : undefined
			}
			onClear={
				selected.length === 0
					? undefined
					: () => onValueChange({ kind: "select", values: [], excluded })
			}
		>
			{searchable && (
				<FilterFieldInput
					id={searchId}
					value={query}
					placeholder={labels.optionSearchPlaceholder}
					aria-label={`${definition.label} — ${labels.search}`}
					onChange={(event) => setQuery(event.target.value)}
				/>
			)}
			<div
				role="listbox"
				aria-multiselectable={multiple}
				aria-label={definition.label}
				className="flex flex-wrap gap-2"
			>
				{fold.visible.map((option) => (
					<OptionToggle
						key={option.value}
						option={option}
						selected={selected.includes(option.value)}
						onToggle={() =>
							onValueChange({
								kind: "select",
								values: toggleValue(selected, option.value, multiple),
								excluded,
							})
						}
					/>
				))}
			</div>
			{fold.foldable && (
				<FoldToggle
					expanded={expanded}
					foldedCount={fold.foldedCount}
					onToggle={() => setExpanded((current) => !current)}
				/>
			)}
		</FilterFieldFrame>
	);
}

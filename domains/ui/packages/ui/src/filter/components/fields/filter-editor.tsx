import { BooleanFilterField } from "#/filter/components/fields/boolean-filter-field.tsx";
import { DateRangeFilterField } from "#/filter/components/fields/date-range-filter-field.tsx";
import { EntityFilterField } from "#/filter/components/fields/entity-filter-field.tsx";
import { GeoRadiusFilterField } from "#/filter/components/fields/geo-radius-filter-field.tsx";
import { MoneyRangeFilterField } from "#/filter/components/fields/money-range-filter-field.tsx";
import { NumberFilterField } from "#/filter/components/fields/number-filter-field.tsx";
import { NumberRangeFilterField } from "#/filter/components/fields/number-range-filter-field.tsx";
import { SelectFilterField } from "#/filter/components/fields/select-filter-field.tsx";
import { TextFilterField } from "#/filter/components/fields/text-filter-field.tsx";
import type { FilterDefinition, FilterValue } from "#/filter/types.ts";

interface Props {
	definition: FilterDefinition;
	value: FilterValue | undefined;
	onValueChange: (value: FilterValue | undefined) => void;
}

/**
 * The editor a definition's `kind` asks for, alone. The value union is
 * discriminated by the same `kind` as the definition, so each branch narrows
 * both at once — a new filter kind is a compile error here until it has one.
 */
export function FilterEditor({ definition, value, onValueChange }: Props) {
	const valueOfKind = <Kind extends FilterValue["kind"]>(kind: Kind) =>
		value?.kind === kind
			? (value as Extract<FilterValue, { kind: Kind }>)
			: undefined;

	switch (definition.kind) {
		case "text":
			return (
				<TextFilterField
					definition={definition}
					value={valueOfKind("text")}
					onValueChange={onValueChange}
				/>
			);
		case "number":
			return (
				<NumberFilterField
					definition={definition}
					value={valueOfKind("number")}
					onValueChange={onValueChange}
				/>
			);
		case "numberRange":
			return (
				<NumberRangeFilterField
					definition={definition}
					value={valueOfKind("numberRange")}
					onValueChange={onValueChange}
				/>
			);
		case "moneyRange":
			return (
				<MoneyRangeFilterField
					definition={definition}
					value={valueOfKind("moneyRange")}
					onValueChange={onValueChange}
				/>
			);
		case "select":
			return (
				<SelectFilterField
					definition={definition}
					value={valueOfKind("select")}
					onValueChange={onValueChange}
				/>
			);
		case "dateRange":
			return (
				<DateRangeFilterField
					definition={definition}
					value={valueOfKind("dateRange")}
					onValueChange={onValueChange}
				/>
			);
		case "geoRadius":
			return (
				<GeoRadiusFilterField
					definition={definition}
					value={valueOfKind("geoRadius")}
					onValueChange={onValueChange}
				/>
			);
		case "entity":
			return (
				<EntityFilterField
					definition={definition}
					value={valueOfKind("entity")}
					onValueChange={onValueChange}
				/>
			);
		case "boolean":
			return (
				<BooleanFilterField
					definition={definition}
					value={valueOfKind("boolean")}
					onValueChange={onValueChange}
				/>
			);
	}
}

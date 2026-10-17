import { Fragment } from "react";
import { FilterField } from "#/filter/components/filter-field.tsx";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";
import type {
	FilterDefinition,
	FilterValue,
	FilterValues,
} from "#/filter/types.ts";
import { Separator } from "#/separator/components/separator.tsx";

interface Props {
	/** The definitions to show — already narrowed by the field search. */
	definitions: ReadonlyArray<FilterDefinition>;
	values: FilterValues;
	onFieldChange: (
		definition: FilterDefinition,
		value: FilterValue | undefined,
	) => void;
}

/**
 * The body of a live editor: one field per definition, separated so a long
 * panel stays scannable, or the "no filter matches" line once the field search
 * left nothing.
 */
export function FilterFieldList({ definitions, values, onFieldChange }: Props) {
	const labels = useFilterLabels();
	if (definitions.length === 0) {
		return (
			<p className="text-muted-foreground text-sm">{labels.noFilterFound}</p>
		);
	}
	return definitions.map((definition, index) => (
		<Fragment key={definition.key}>
			{index > 0 && <Separator />}
			<FilterField
				definition={definition}
				value={values[definition.key]}
				onValueChange={(value) => onFieldChange(definition, value)}
			/>
		</Fragment>
	));
}

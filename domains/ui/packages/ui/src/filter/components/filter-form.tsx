import type * as React from "react";
import { Fragment } from "react";
import { FilterField } from "#/filter/components/filter-field.tsx";
import { FilterProvider } from "#/filter/components/filter-provider.tsx";
import { setFilterValue } from "#/filter/lib/filter-values.ts";
import type {
	FilterDefinition,
	FilterLabels,
	FilterValues,
} from "#/filter/types.ts";
import { cn } from "#/lib/utils.ts";
import { Separator } from "#/separator/components/separator.tsx";

interface Props extends React.ComponentProps<"div"> {
	/** The filters to edit, in the order they are rendered. */
	definitions: ReadonlyArray<FilterDefinition>;
	/** The record being edited. Controlled — this component keeps no draft. */
	values: FilterValues;
	/**
	 * Called on every edit, not on an apply: `Filter.Form` is the editor without
	 * the commit step, so hold the record in your own state and decide when to
	 * query. For draft-then-apply, use `Filter.Root` or `Filter.Panel`.
	 */
	onValuesChange: (values: FilterValues) => void;
	/**
	 * Overrides for the strings the editor shows, merged over the surrounding
	 * filter root's (English defaults at the outermost level), so a partial is
	 * enough.
	 */
	labels?: Partial<FilterLabels>;
	/** BCP 47 tag used to format the numbers, money and dates; inherited when omitted. */
	locale?: string;
}

/**
 * The editor: every declared filter, in declaration order, separated so a long
 * panel stays scannable. It edits a whole `FilterValues` record — clearing a
 * field removes its key, so the record never carries empty filters. Standalone
 * it is a settings screen's form; inside a filter root it inherits the root's
 * copy.
 */
export function FilterForm({
	definitions,
	values,
	onValuesChange,
	labels,
	locale,
	className,
	...props
}: Props) {
	return (
		<FilterProvider labels={labels} locale={locale}>
			<div
				data-slot="filter-form"
				className={cn("flex flex-col gap-5", className)}
				{...props}
			>
				{definitions.map((definition, index) => (
					<Fragment key={definition.key}>
						{index > 0 && <Separator />}
						<FilterField
							definition={definition}
							value={values[definition.key]}
							onValueChange={(value) =>
								onValuesChange(setFilterValue(values, definition.key, value))
							}
						/>
					</Fragment>
				))}
			</div>
		</FilterProvider>
	);
}

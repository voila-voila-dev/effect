import { XIcon } from "@phosphor-icons/react";
import type * as React from "react";
import { useState } from "react";
import { Button } from "#/button/components/button.tsx";
import {
	FilterDefinitionSearch,
	SEARCHABLE_FROM_DEFINITIONS,
} from "#/filter/components/fields/filter-definition-search.tsx";
import { FilterFieldList } from "#/filter/components/fields/filter-field-list.tsx";
import { FilterProvider } from "#/filter/components/filter-provider.tsx";
import { FilterSheet } from "#/filter/components/filter-sheet.tsx";
import { useFilterSettings } from "#/filter/hooks/use-filter-settings.ts";
import { useLiveFilterValues } from "#/filter/hooks/use-live-filter-values.ts";
import { countActiveFilters } from "#/filter/lib/filter-values.ts";
import { matchFilterDefinitions } from "#/filter/lib/match-filter-definitions.ts";
import type {
	FilterDefinition,
	FilterLabels,
	FilterValues,
} from "#/filter/types.ts";
import { useIsMobile } from "#/hooks/use-mobile.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"aside"> {
	/** Whether the rail shows. Controlled; the bar's trigger usually toggles it. */
	open: boolean;
	/** Called by the rail's own close button (and by the drawer on mobile). */
	onOpenChange: (open: boolean) => void;
	/** The filters to edit, in the order they are rendered. */
	definitions: ReadonlyArray<FilterDefinition>;
	/** The applied record. Changes made elsewhere (a removed chip) flow back in. */
	values: FilterValues;
	/**
	 * Called as the filters change: at once for a tap, after a 300 ms pause for
	 * typing. Safe to use as a fetch key.
	 */
	onValuesChange: (values: FilterValues) => void;
	/**
	 * Overrides for the strings the rail shows, merged over the surrounding
	 * filter root's. The rail usually sits outside the bar that declared the
	 * copy, so pass the same labels to both.
	 */
	labels?: Partial<FilterLabels>;
	/** BCP 47 tag used to format the numbers, money and dates; inherited when omitted. */
	locale?: string;
}

/**
 * The editor, docked: a column beside the list on desktop that stays open while
 * you sort, page and move between screens, and the live `Filter.Sheet` drawer on
 * a phone — where a rail would leave no room for the rows it filters.
 *
 * Docked rather than overlaid because filtering is not a detour: an operator
 * narrows, reads the rows, narrows again. A panel that covers the answer has to
 * be dismissed before each read. Pair it with `Filter.Root`'s
 * `panelRenderedElsewhere`, so the bar's button toggles this rail.
 */
export function FilterDock({
	open,
	onOpenChange,
	definitions,
	values,
	onValuesChange,
	labels: labelOverrides,
	locale: localeOverride,
	className,
	...props
}: Props) {
	const { labels, locale } = useFilterSettings(labelOverrides, localeOverride);
	const isMobile = useIsMobile();
	const { draft, change, clearAll } = useLiveFilterValues(
		values,
		onValuesChange,
	);
	const [fieldQuery, setFieldQuery] = useState("");

	if (isMobile) {
		return (
			<FilterSheet
				open={open}
				onOpenChange={onOpenChange}
				definitions={definitions}
				values={values}
				onValuesChange={onValuesChange}
				labels={labels}
				locale={locale}
			/>
		);
	}

	if (!open) {
		return null;
	}

	return (
		<FilterProvider labels={labels} locale={locale}>
			{/* `sticky` under the page header: the rail follows a long list down
			    instead of scrolling away from the rows it is narrowing. `shrink-0`
			    keeps the table from squeezing it as columns grow. */}
			<aside
				data-slot="filter-dock"
				aria-label={labels.title}
				className={cn(
					"sticky top-4 flex max-h-[calc(100vh-6rem)] w-72 shrink-0 flex-col gap-4 self-start rounded-xl border border-border bg-card p-4",
					className,
				)}
				{...props}
			>
				<div className="flex items-center justify-between gap-2">
					<h2 className="font-medium text-sm">{labels.title}</h2>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={labels.close}
						onClick={() => onOpenChange(false)}
					>
						<XIcon />
					</Button>
				</div>

				{/* The fields scroll inside the rail; the header and the clear stay put. */}
				<div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
					{definitions.length >= SEARCHABLE_FROM_DEFINITIONS && (
						<FilterDefinitionSearch
							value={fieldQuery}
							onValueChange={setFieldQuery}
						/>
					)}
					<FilterFieldList
						definitions={matchFilterDefinitions(definitions, fieldQuery)}
						values={draft}
						onFieldChange={change}
					/>
				</div>

				{countActiveFilters(draft) > 0 && (
					<Button type="button" variant="ghost" size="sm" onClick={clearAll}>
						{labels.clearAll}
					</Button>
				)}
			</aside>
		</FilterProvider>
	);
}

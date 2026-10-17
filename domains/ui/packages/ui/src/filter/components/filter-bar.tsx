import type * as React from "react";
import { useState } from "react";
import { FilterButton } from "#/filter/components/filter-button.tsx";
import { FilterChips } from "#/filter/components/filter-chips.tsx";
import { FilterPanel } from "#/filter/components/filter-panel.tsx";
import { FilterProvider } from "#/filter/components/filter-provider.tsx";
import { FilterSearchInput } from "#/filter/components/filter-search-input.tsx";
import { FilterSheet } from "#/filter/components/filter-sheet.tsx";
import { FilterTrigger } from "#/filter/components/filter-trigger.tsx";
import { useFilterSettings } from "#/filter/hooks/use-filter-settings.ts";
import { countActiveFilters } from "#/filter/lib/filter-values.ts";
import type {
	FilterDefinition,
	FilterLabels,
	FilterValues,
} from "#/filter/types.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"div"> {
	/**
	 * The filters this screen offers, in the order the editor shows them. The
	 * same array drives the editor, the chips and your own query layer.
	 */
	definitions: ReadonlyArray<FilterDefinition>;
	/**
	 * The applied filters, keyed by `definition.key`. Never holds an empty
	 * filter — clearing one deletes its key — so `Object.keys(values).length` is
	 * the active count and the record round-trips to a query string unchanged.
	 */
	values: FilterValues;
	/**
	 * Called with the new applied record, and immediately when a chip is
	 * removed. In `apply` mode once per Apply — drafts inside the editor never
	 * reach it; in `live` mode as the filters change, typing after a 300 ms
	 * pause. Either way it is safe to use as a fetch key.
	 */
	onValuesChange: (values: FilterValues) => void;
	/**
	 * How the editor commits. `apply` (the default): a search-field-shaped
	 * trigger opens a dialog whose edits are a draft committed on Apply, search
	 * included. `live`: a real search input sits in the bar beside a "Filters"
	 * button, and the side sheet behind it applies each change as it happens.
	 */
	mode?: "apply" | "live";
	/** Omit both search props for a list that filters without free text. */
	searchValue?: string;
	/** Called on every keystroke (in `apply` mode, on Apply). Debounce your query. */
	onSearchChange?: (value: string) => void;
	/**
	 * How many rows the current filters matched, shown next to the trigger. Omit
	 * it while the count is unknown rather than passing `0`.
	 */
	resultCount?: number;
	/**
	 * Overrides for the strings the surface shows. Merged over
	 * `defaultFilterLabels` (English), so a partial is enough.
	 */
	labels?: Partial<FilterLabels>;
	/**
	 * BCP 47 tag used to format the numbers, money and dates in the chips and
	 * the editor.
	 */
	locale?: string;
	/**
	 * Let the trigger (or the search input) fill the row instead of capping at
	 * `max-w-md`. The cap suits wide tables; a narrow content column wants the
	 * bar flush with the cards below it.
	 */
	fullWidthTrigger?: boolean;
	/**
	 * Drop the chips row. For filters that are standing preferences rather than
	 * ad-hoc facets: the active count on the trigger already says they apply,
	 * and chips would restate them forever.
	 */
	hideChips?: boolean;
	/**
	 * Drive the editor from outside, for a screen with a second way in (an
	 * empty state whose call to action is "adjust your filters"). Omit both to
	 * let the bar own the state.
	 */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/**
	 * Leave the editor to the caller: a list that docks `Filter.Dock` beside its
	 * table keeps only the bar here, and the bar's button toggles the rail
	 * through `open`/`onOpenChange` — so the two never both draw the fields.
	 */
	panelRenderedElsewhere?: boolean;
}

/**
 * The whole filtering surface of a list, in one component: the search, the
 * editor behind its trigger, the chips stating what is active, and the result
 * count. Screens declare their filters and hand over the applied record —
 * everything else (draft or live apply, responsiveness, copy) lives here so
 * every list filters the same way.
 */
export function FilterBar({
	definitions,
	values,
	onValuesChange,
	mode = "apply",
	searchValue,
	onSearchChange,
	resultCount,
	labels: labelOverrides,
	locale: localeOverride,
	fullWidthTrigger = false,
	hideChips = false,
	open: controlledOpen,
	onOpenChange,
	panelRenderedElsewhere = false,
	className,
	...props
}: Props) {
	const { labels, locale } = useFilterSettings(labelOverrides, localeOverride);
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const open = controlledOpen ?? uncontrolledOpen;
	const setOpen = (next: boolean) => {
		setUncontrolledOpen(next);
		onOpenChange?.(next);
	};
	// A docked editor stays open across reads, so the bar's button toggles it.
	const openEditor = panelRenderedElsewhere
		? () => setOpen(!open)
		: () => setOpen(true);
	const activeCount = countActiveFilters(values);
	const hasEditor = definitions.length > 0;
	const triggerWidth = fullWidthTrigger
		? "min-w-0 flex-1"
		: "min-w-0 flex-1 sm:max-w-md";

	return (
		<FilterProvider labels={labels} locale={locale}>
			<div
				data-slot="filter-bar"
				className={cn("flex w-full min-w-0 flex-col gap-3", className)}
				{...props}
			>
				{/* `min-w-0` on the growing child: without it a flex item refuses to
				    shrink below its content, and the nowrap result count pushes the
				    row past the viewport — a phone then scrolls sideways. */}
				<div
					className={cn(
						"flex min-w-0 items-center",
						mode === "apply" ? "gap-3" : "gap-2",
					)}
				>
					{mode === "apply" ? (
						<FilterTrigger
							summary={
								searchValue === undefined || searchValue === ""
									? undefined
									: searchValue
							}
							activeCount={activeCount}
							className={triggerWidth}
							aria-pressed={panelRenderedElsewhere ? open : undefined}
							onClick={openEditor}
						/>
					) : (
						<>
							{onSearchChange !== undefined && (
								<FilterSearchInput
									value={searchValue ?? ""}
									onValueChange={onSearchChange}
									className={triggerWidth}
								/>
							)}
							{hasEditor && (
								<FilterButton
									activeCount={activeCount}
									aria-pressed={panelRenderedElsewhere ? open : undefined}
									className={
										onSearchChange === undefined
											? "min-w-0 flex-1 justify-start"
											: "shrink-0"
									}
									onClick={openEditor}
								/>
							)}
						</>
					)}
					{resultCount !== undefined && (
						<span
							className={cn(
								"shrink-0 whitespace-nowrap text-muted-foreground text-sm",
								// Live: the count sits at the far end, past the button.
								mode === "live" && "ml-auto",
							)}
						>
							{labels.resultCount(resultCount)}
						</span>
					)}
				</div>

				{!hideChips && (
					<FilterChips
						definitions={definitions}
						values={values}
						onValuesChange={onValuesChange}
						onChipClick={() => setOpen(true)}
					/>
				)}

				{panelRenderedElsewhere ? null : mode === "apply" ? (
					<FilterPanel
						open={open}
						onOpenChange={setOpen}
						definitions={definitions}
						values={values}
						onValuesChange={onValuesChange}
						searchValue={searchValue}
						onSearchChange={onSearchChange}
					/>
				) : (
					hasEditor && (
						<FilterSheet
							open={open}
							onOpenChange={setOpen}
							definitions={definitions}
							values={values}
							onValuesChange={onValuesChange}
						/>
					)
				)}
			</div>
		</FilterProvider>
	);
}

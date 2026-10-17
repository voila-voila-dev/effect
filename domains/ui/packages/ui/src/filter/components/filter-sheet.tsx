import { useState } from "react";
import { Button } from "#/button/components/button.tsx";
import {
	FilterDefinitionSearch,
	SEARCHABLE_FROM_DEFINITIONS,
} from "#/filter/components/fields/filter-definition-search.tsx";
import { FilterFieldList } from "#/filter/components/fields/filter-field-list.tsx";
import { FilterProvider } from "#/filter/components/filter-provider.tsx";
import { useFilterSettings } from "#/filter/hooks/use-filter-settings.ts";
import { useLiveFilterValues } from "#/filter/hooks/use-live-filter-values.ts";
import { countActiveFilters } from "#/filter/lib/filter-values.ts";
import { matchFilterDefinitions } from "#/filter/lib/match-filter-definitions.ts";
import type {
	FilterDefinition,
	FilterLabels,
	FilterValues,
} from "#/filter/types.ts";
import { ResponsiveSheet } from "#/responsive-sheet/components/responsive-sheet.tsx";

interface Props {
	/** Whether the sheet is open. Controlled; pair it with `onOpenChange`. */
	open: boolean;
	/** Called when the sheet is dismissed or closed from its footer. Edits are already applied. */
	onOpenChange: (open: boolean) => void;
	/** The filters to edit, in the order they are rendered. */
	definitions: ReadonlyArray<FilterDefinition>;
	/** The applied record. Changes made elsewhere (a removed chip) flow back in. */
	values: FilterValues;
	/**
	 * Called as the filters change: at once for a tap (an option, a preset, a
	 * place), after a 300 ms pause for typing. Safe to use as a fetch key.
	 */
	onValuesChange: (values: FilterValues) => void;
	/**
	 * Overrides for the strings the sheet shows, merged over the surrounding
	 * filter root's (English defaults at the outermost level).
	 */
	labels?: Partial<FilterLabels>;
	/** BCP 47 tag used to format the numbers, money and dates; inherited when omitted. */
	locale?: string;
}

/**
 * The editor as a side sheet on desktop and a bottom drawer on mobile, applying
 * live: the list (and the URL behind it) updates as filters change, so the
 * sheet can stay open while the results shift behind it — the counterpart of
 * `Filter.Panel`'s draft-then-apply. From six filters on, a search box at the
 * top finds one by name.
 */
export function FilterSheet({
	open,
	onOpenChange,
	definitions,
	values,
	onValuesChange,
	labels: labelOverrides,
	locale: localeOverride,
}: Props) {
	const { labels, locale } = useFilterSettings(labelOverrides, localeOverride);
	const { draft, change, clearAll } = useLiveFilterValues(
		values,
		onValuesChange,
	);
	const [fieldQuery, setFieldQuery] = useState("");

	return (
		<FilterProvider labels={labels} locale={locale}>
			<ResponsiveSheet.Root open={open} onOpenChange={onOpenChange}>
				{/* No autofocus: on a phone, focusing the field search would throw the
				    keyboard over the filters you came to read. The footer's Close is
				    the one way out shown: a corner X beside it would give two buttons
				    one accessible name. */}
				<ResponsiveSheet.Content
					size="default"
					showCloseButton={false}
					autoFocus={false}
				>
					<ResponsiveSheet.Header>
						<ResponsiveSheet.Title>{labels.title}</ResponsiveSheet.Title>
						{labels.description !== undefined && (
							<ResponsiveSheet.Description>
								{labels.description}
							</ResponsiveSheet.Description>
						)}
						{definitions.length >= SEARCHABLE_FROM_DEFINITIONS && (
							<FilterDefinitionSearch
								value={fieldQuery}
								onValueChange={setFieldQuery}
							/>
						)}
					</ResponsiveSheet.Header>

					<ResponsiveSheet.Body className="flex min-w-0 flex-col gap-5">
						<FilterFieldList
							definitions={matchFilterDefinitions(definitions, fieldQuery)}
							values={draft}
							onFieldChange={change}
						/>
					</ResponsiveSheet.Body>

					<ResponsiveSheet.Footer>
						<Button
							type="button"
							variant="ghost"
							disabled={countActiveFilters(draft) === 0}
							onClick={clearAll}
						>
							{labels.clearAll}
						</Button>
						<Button type="button" onClick={() => onOpenChange(false)}>
							{labels.close}
						</Button>
					</ResponsiveSheet.Footer>
				</ResponsiveSheet.Content>
			</ResponsiveSheet.Root>
		</FilterProvider>
	);
}

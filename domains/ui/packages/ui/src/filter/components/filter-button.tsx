import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import type * as React from "react";
import { Badge } from "#/badge/components/badge.tsx";
import { Button } from "#/button/components/button.tsx";
import { useFilterSettings } from "#/filter/hooks/use-filter-settings.ts";
import type { FilterLabels } from "#/filter/types.ts";

interface Props extends React.ComponentProps<typeof Button> {
	/**
	 * Number of active filters, shown as a badge so a filtered list never reads
	 * as a short one; pass `countActiveFilters(values)`.
	 */
	activeCount: number;
	/**
	 * Overrides for the strings this button shows, merged over the surrounding
	 * filter root's (English defaults at the outermost level).
	 */
	labels?: Partial<FilterLabels>;
}

/**
 * The "Filters" button beside a live search input: it opens the editor, or —
 * with `aria-pressed` — toggles a docked one, and carries the active count.
 * `Filter.Trigger` is the other shape, a search-field-looking button for
 * lists whose search lives inside the editor.
 */
export function FilterButton({
	activeCount,
	labels: labelOverrides,
	variant = "outline",
	children,
	...props
}: Props) {
	const { labels } = useFilterSettings(labelOverrides, undefined);
	return (
		<Button
			type="button"
			data-slot="filter-button"
			variant={variant}
			{...props}
		>
			<SlidersHorizontalIcon />
			{children ?? labels.trigger}
			{activeCount > 0 && (
				<Badge variant="default" size="sm">
					{activeCount}
				</Badge>
			)}
		</Button>
	);
}

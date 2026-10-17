import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type * as React from "react";
import { useFilterSettings } from "#/filter/hooks/use-filter-settings.ts";
import type { FilterLabels } from "#/filter/types.ts";
import { InputGroup } from "#/input-group/components/input-group.tsx";

interface Props
	extends Omit<React.ComponentProps<typeof InputGroup.Root>, "onChange"> {
	/** The search text. Controlled. */
	value: string;
	/** Called on every keystroke, and with `""` from the clear button. Debounce your query. */
	onValueChange: (value: string) => void;
	/** Overrides `labels.searchPlaceholder` for this one list ("Search by email…"). */
	placeholder?: string;
	/**
	 * Overrides for the strings this input shows, merged over the surrounding
	 * filter root's (English defaults at the outermost level).
	 */
	labels?: Partial<FilterLabels>;
}

/**
 * The free-text search of a filtered list, as a real input living in the bar:
 * typing filters as you look, no overlay in the way. Debouncing belongs to
 * whoever owns the state — this control reports every keystroke.
 */
export function FilterSearchInput({
	value,
	onValueChange,
	placeholder,
	labels: labelOverrides,
	...props
}: Props) {
	const { labels } = useFilterSettings(labelOverrides, undefined);
	return (
		<InputGroup.Root data-slot="filter-search-input" {...props}>
			<InputGroup.Addon>
				<MagnifyingGlassIcon className="size-4" />
			</InputGroup.Addon>
			<InputGroup.Input
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				placeholder={placeholder ?? labels.searchPlaceholder}
				aria-label={labels.search}
				autoComplete="off"
				autoCorrect="off"
				spellCheck={false}
			/>
			{value.length > 0 && (
				<InputGroup.Addon align="inline-end">
					<InputGroup.Button
						size="icon-xs"
						aria-label={labels.clear}
						onClick={() => onValueChange("")}
					>
						<XIcon />
					</InputGroup.Button>
				</InputGroup.Addon>
			)}
		</InputGroup.Root>
	);
}

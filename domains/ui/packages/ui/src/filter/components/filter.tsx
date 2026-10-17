import { FilterBar } from "#/filter/components/filter-bar.tsx";
import { FilterButton } from "#/filter/components/filter-button.tsx";
import { FilterChips } from "#/filter/components/filter-chips.tsx";
import { FilterDock } from "#/filter/components/filter-dock.tsx";
import { FilterField } from "#/filter/components/filter-field.tsx";
import { FilterForm } from "#/filter/components/filter-form.tsx";
import { FilterPanel } from "#/filter/components/filter-panel.tsx";
import { FilterProvider } from "#/filter/components/filter-provider.tsx";
import { FilterSearchInput } from "#/filter/components/filter-search-input.tsx";
import { FilterSheet } from "#/filter/components/filter-sheet.tsx";
import { FilterTrigger } from "#/filter/components/filter-trigger.tsx";

/**
 * The Filter parts as one namespace.
 *
 * `Root` is the bar that holds the search, the trigger and the chips. The
 * editor comes in three shapes: `Panel` (a dialog, draft then apply), `Sheet`
 * (a side sheet applying live) and `Dock` (a rail beside the list, applying
 * live). `Form` is the editor with no surface around it, `Field` one
 * definition. `Trigger` and `Button` open an editor, `SearchInput` is the
 * bar's live search, and `Provider` sets the copy and locale once for every
 * part below it.
 */
export const Filter = {
	Root: FilterBar,
	Button: FilterButton,
	Chips: FilterChips,
	Dock: FilterDock,
	Field: FilterField,
	Form: FilterForm,
	Panel: FilterPanel,
	Provider: FilterProvider,
	SearchInput: FilterSearchInput,
	Sheet: FilterSheet,
	Trigger: FilterTrigger,
};

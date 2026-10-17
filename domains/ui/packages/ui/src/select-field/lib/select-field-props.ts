import type { FocusEvent } from "react";
import type {
	SelectFieldOption,
	SelectFieldSize,
} from "#/select-field/lib/select-field-option.ts";

/**
 * The props both renderings take. A data interface rather than DOM props: the
 * field renders a select trigger or a combobox input depending on `onCreate`,
 * so there is no single element to spread onto.
 */
export interface SelectFieldProps {
	readonly options: ReadonlyArray<SelectFieldOption>;
	/** Null while nothing is picked, or when `nullOption` is chosen. */
	readonly value: string | null;
	readonly onValueChange: (value: string | null) => void;
	/**
	 * Lets the reader keep what they typed when no option matches, turning the
	 * select into a field you can type into. Called with the typed text.
	 *
	 * A list is never finished, and the reader who notices is mid-sentence:
	 * sending them off to create the option somewhere else loses whatever they
	 * were in the middle of. Omit it and the list stays a closed set, which is
	 * what most lists are.
	 */
	readonly onCreate?: (query: string) => void;
	/** What the create row reads as. Defaults to `Create "<query>"`. */
	readonly createLabel?: (query: string) => string;
	/**
	 * What the open list says when it has no row to offer — an empty catalog
	 * with nothing typed yet. Without it the popup stays hidden instead of
	 * opening as a bare box. Creatable only: a closed select over no options is
	 * the caller's empty state, not the list's.
	 */
	readonly emptyHint?: string;
	/**
	 * True while the options are being (re)fetched. The open list swaps the
	 * empty hint for a spinner, so a list still crossing the network is never
	 * announced as empty. Creatable only, like `emptyHint`.
	 */
	readonly loading?: boolean;
	/**
	 * The typed text, when the caller narrows the options itself — a list
	 * coming from a server has already answered the query. Left out, the
	 * control narrows the options it was handed.
	 */
	readonly searchValue?: string;
	readonly onSearchChange?: (query: string) => void;
	readonly placeholder?: string;
	/**
	 * A deliberate "no option" row ("None", "All categories"). Choosing it
	 * emits `null`. Without it, the empty value stays the placeholder and is
	 * never emitted. Closed select only.
	 */
	readonly nullOption?: { readonly label: string };
	readonly disabled?: boolean;
	readonly size?: SelectFieldSize;
	readonly invalid?: boolean;
	readonly id?: string;
	/** Lands on the trigger or the input as `data-testid`. */
	readonly testId?: string;
	readonly name?: string;
	readonly className?: string;
	readonly onBlur?: (event: FocusEvent<HTMLElement>) => void;
	/** Blur into the control's own popup, which must not count as leaving it. */
	readonly isBlurIntoOwnPopup?: (event: FocusEvent<HTMLElement>) => boolean;
}

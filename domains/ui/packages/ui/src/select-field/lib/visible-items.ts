import { normalizeLabel } from "#/select-field/lib/normalize-label.ts";
import type { SelectFieldOption } from "#/select-field/lib/select-field-option.ts";

/** The create row's sentinel. Never a real option's value. */
export const CREATE_VALUE = "__select-field-create__";

interface Input {
	readonly options: ReadonlyArray<SelectFieldOption>;
	readonly typed: string;
	readonly narrowedByCaller: boolean;
	readonly createLabel: (query: string) => string;
}

/**
 * What the list shows for a query: the options that match, and the create row
 * when the typed text is not already an option.
 *
 * Narrowing happens here whenever the caller is not already doing it against
 * a server. Doing it here rather than leaving it to the combobox keeps one
 * rule, and keeps the create row out of it — the one row that must never be
 * filtered out is the one that exists because nothing matched.
 */
export function visibleItems({
	options,
	typed,
	narrowedByCaller,
	createLabel,
}: Input): ReadonlyArray<SelectFieldOption> {
	const query = normalizeLabel(typed);
	const matching =
		narrowedByCaller || typed === ""
			? options
			: options.filter((option) =>
					normalizeLabel(option.label).includes(query),
				);

	// Only offer to create what is not already an option, matched or not: a
	// reader who typed an existing label wants that option, not a twin.
	const canCreate =
		typed.length > 0 &&
		!options.some((option) => normalizeLabel(option.label) === query);

	return canCreate
		? [...matching, { value: CREATE_VALUE, label: createLabel(typed) }]
		: matching;
}

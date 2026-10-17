import { SelectFieldClosed } from "#/select-field/components/select-field-closed.tsx";
import { SelectFieldCreatable } from "#/select-field/components/select-field-creatable.tsx";
import type { SelectFieldProps } from "#/select-field/lib/select-field-props.ts";

interface Props extends SelectFieldProps {}

/**
 * A select over a known list of options, optionally one you can add to — the
 * form field built from `ResponsiveSelect` and `Combobox`, so a form does not
 * re-wire either for the common case.
 *
 * Presentation only: it takes the options already resolved and labelled.
 * Where they come from, what to say while they load and what to say when they
 * fail stay with the caller.
 *
 * Creating is one more row at the end of the list rather than a control of
 * its own: to the reader this is the same select, with somewhere to put what
 * they typed when nothing matched. Typing needs a text input, which a select
 * trigger is not, so a creatable field (`onCreate`) renders a combobox
 * underneath — styled as the trigger it replaces, with shared heights so the
 * two cannot drift apart. A closed field keeps `ResponsiveSelect`'s native
 * picker on phones.
 */
export function SelectField(props: Props) {
	return props.onCreate === undefined ? (
		<SelectFieldClosed {...props} />
	) : (
		<SelectFieldCreatable {...props} />
	);
}

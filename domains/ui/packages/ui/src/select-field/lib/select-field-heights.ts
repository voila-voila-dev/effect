import type { SelectFieldSize } from "#/select-field/lib/select-field-option.ts";

/**
 * Trigger heights, in one place so the two renderings cannot drift. The kit's
 * select trigger stops at `sm`/`default`; `lg` is for forms filled in
 * one-handed on a phone.
 */
export const TRIGGER_HEIGHTS: Record<SelectFieldSize, string> = {
	sm: "h-7",
	default: "h-8",
	lg: "h-9",
};

/**
 * The same heights for the combobox, whose input group pins its inner control
 * regardless of the wrapper — raise only the wrapper and the text floats in a
 * box that grew around it.
 */
export const COMBOBOX_HEIGHTS: Record<SelectFieldSize, string> = {
	sm: "h-7 [&>input[data-slot=input-group-control]]:h-[calc(1.75rem-2px)]",
	default: "h-8 [&>input[data-slot=input-group-control]]:h-[calc(2rem-2px)]",
	lg: "h-9 [&>input[data-slot=input-group-control]]:h-[calc(2.25rem-2px)]",
};

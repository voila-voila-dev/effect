/** One selectable row, already resolved to the label the reader sees. */
export interface SelectFieldOption {
	readonly value: string;
	readonly label: string;
}

/** Control heights shared by the trigger and the creatable combobox. */
export type SelectFieldSize = "sm" | "default" | "lg";

import {
	SelectField,
	type SelectFieldOption,
} from "@voila.dev/ui/select-field";
import { useState } from "react";

const roles: SelectFieldOption[] = [
	{ value: "design", label: "Designer" },
	{ value: "dev", label: "Developer" },
	{ value: "pm", label: "Product manager" },
];

export function Default() {
	const [value, setValue] = useState<string | null>(null);
	return (
		<div className="w-full max-w-xs">
			<SelectField
				options={roles}
				value={value}
				onValueChange={setValue}
				placeholder="Pick a role"
			/>
		</div>
	);
}

export function NullOption() {
	const [value, setValue] = useState<string | null>("dev");
	return (
		<div className="flex w-full max-w-xs flex-col gap-2">
			<SelectField
				options={roles}
				value={value}
				onValueChange={setValue}
				nullOption={{ label: "All roles" }}
				placeholder="Filter by role"
			/>
			<p className="text-muted-foreground text-xs">
				value: {value === null ? "null" : `"${value}"`}
			</p>
		</div>
	);
}

export function Creatable() {
	const [options, setOptions] = useState(roles);
	const [value, setValue] = useState<string | null>(null);
	return (
		<div className="w-full max-w-xs">
			<SelectField
				options={options}
				value={value}
				onValueChange={setValue}
				onCreate={(label) => {
					const option = { value: label.toLowerCase(), label };
					setOptions((current) => [...current, option]);
					setValue(option.value);
				}}
				createLabel={(query) => `Add role "${query}"`}
				placeholder="Pick or type a role"
			/>
		</div>
	);
}

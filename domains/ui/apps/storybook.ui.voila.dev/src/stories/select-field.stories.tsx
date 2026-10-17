import type { Meta, StoryObj } from "@storybook/tanstack-react";
import {
	SelectField,
	type SelectFieldOption,
} from "@voila.dev/ui/select-field";
import { useState } from "react";

const roles: SelectFieldOption[] = [
	{ value: "design", label: "Designer" },
	{ value: "dev", label: "Developer" },
	{ value: "pm", label: "Product manager" },
	{ value: "etude", label: "Étude" },
];

const meta = {
	title: "UI/SelectField",
	component: SelectField,
	tags: ["autodocs"],
	args: {
		options: roles,
		value: null,
		onValueChange: () => {},
	},
} satisfies Meta<typeof SelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

function Closed({ withNull }: { withNull?: boolean }) {
	const [value, setValue] = useState<string | null>(null);
	return (
		<div className="w-64">
			<SelectField
				options={roles}
				value={value}
				onValueChange={setValue}
				nullOption={withNull ? { label: "All roles" } : undefined}
				placeholder="Pick a role"
			/>
		</div>
	);
}

/** A closed list; the native picker on phones. */
export const Default: Story = {
	render: () => <Closed />,
};

/** `nullOption`: "nothing" as a real choice, emitted as `null`. */
export const NullOption: Story = {
	render: () => <Closed withNull />,
};

function Creatable({ loading }: { loading?: boolean }) {
	const [options, setOptions] = useState(loading ? [] : roles);
	const [value, setValue] = useState<string | null>(null);
	return (
		<div className="w-64">
			<SelectField
				options={options}
				value={value}
				onValueChange={setValue}
				onCreate={(label) => {
					const option = { value: label.toLowerCase(), label };
					setOptions((current) => [...current, option]);
					setValue(option.value);
				}}
				loading={loading}
				emptyHint="No roles yet. Type one."
				placeholder="Pick or type a role"
			/>
		</div>
	);
}

/** Type something new: the last row creates it. "etude" finds "Étude". */
export const CreatableField: Story = {
	render: () => <Creatable />,
};

/** While the options travel, the open list shows a spinner, not "empty". */
export const Loading: Story = {
	render: () => <Creatable loading />,
};

/** The three heights, shared by the trigger and the creatable input. */
export const Sizes: Story = {
	render: () => (
		<div className="flex w-64 flex-col gap-2">
			{(["sm", "default", "lg"] as const).map((size) => (
				<SelectField
					key={size}
					options={roles}
					value={null}
					onValueChange={() => {}}
					size={size}
					placeholder={size}
				/>
			))}
		</div>
	),
};

import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { ExpandingTextareaInput } from "@voila.dev/ui/expanding-textarea-input";
import { useState } from "react";

const meta = {
	title: "UI/ExpandingTextareaInput",
	component: ExpandingTextareaInput,
	tags: ["autodocs"],
	args: {
		value: "",
		onValueChange: () => {},
		ariaLabel: "Notes",
	},
} satisfies Meta<typeof ExpandingTextareaInput>;

export default meta;

type Story = StoryObj<typeof meta>;

function Controlled({
	initial,
	invalid,
}: {
	initial: string;
	invalid?: boolean;
}) {
	const [value, setValue] = useState(initial);
	return (
		<div className="w-64 rounded-lg border">
			<ExpandingTextareaInput
				value={value}
				onValueChange={setValue}
				ariaLabel="Notes"
				placeholder="Add a note"
				invalid={invalid}
			/>
		</div>
	);
}

/** The closed cell previews the first line; open it to write with line breaks. */
export const Default: Story = {
	render: () => (
		<Controlled
			initial={"Bring the signed brief.\nParking is behind the building."}
		/>
	),
};

/** An empty value previews the placeholder, muted. */
export const Empty: Story = {
	render: () => <Controlled initial="" />,
};

/** `invalid` raises the destructive ring, like any invalid control. */
export const Invalid: Story = {
	render: () => <Controlled initial="Too long" invalid />,
};

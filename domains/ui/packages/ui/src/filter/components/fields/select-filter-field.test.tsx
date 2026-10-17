// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SelectFilterField } from "#/filter/components/fields/select-filter-field.tsx";
import type {
	SelectFilterDefinition,
	SelectFilterValue,
} from "#/filter/types.ts";

const definition: SelectFilterDefinition = {
	kind: "select",
	key: "skill",
	label: "Skill",
	multiple: true,
	options: [
		{ value: "designer", label: "Designer" },
		{ value: "developer", label: "Developer" },
		{ value: "calligrapher", label: "Calligrapher", secondary: true },
		{ value: "glassblower", label: "Glassblower", secondary: true },
	],
};

function Fixture({ initial }: { initial?: SelectFilterValue }) {
	const [value, setValue] = useState<SelectFilterValue | undefined>(initial);
	return (
		<SelectFilterField
			definition={definition}
			value={value}
			onValueChange={setValue}
		/>
	);
}

afterEach(cleanup);

describe("SelectFilterField secondary options", () => {
	it("folds the secondary options behind the more toggle", () => {
		const screen = render(<Fixture />);
		expect(screen.queryByText("Designer")).toBeTruthy();
		expect(screen.queryByText("Calligrapher")).toBeNull();

		fireEvent.click(screen.getByText("2 more…"));
		expect(screen.queryByText("Calligrapher")).toBeTruthy();
		expect(screen.queryByText("Glassblower")).toBeTruthy();

		fireEvent.click(screen.getByText("Show less"));
		expect(screen.queryByText("Calligrapher")).toBeNull();
	});

	it("keeps a selected secondary option visible while folded", () => {
		const screen = render(
			<Fixture initial={{ kind: "select", values: ["calligrapher"] }} />,
		);
		expect(screen.queryByText("Calligrapher")).toBeTruthy();
		expect(screen.queryByText("Glassblower")).toBeNull();
		// Only the unselected secondary option is left behind the toggle.
		expect(screen.queryByText("1 more…")).toBeTruthy();
	});

	it("searches across the folded options", () => {
		// Eight options so the field grows its search box.
		const searchable: SelectFilterDefinition = {
			...definition,
			options: [
				...definition.options,
				{ value: "a", label: "Alpha", secondary: true },
				{ value: "b", label: "Beta", secondary: true },
				{ value: "c", label: "Gamma", secondary: true },
				{ value: "d", label: "Delta", secondary: true },
			],
		};
		const screen = render(
			<SelectFilterField
				definition={searchable}
				value={undefined}
				onValueChange={() => {}}
			/>,
		);
		expect(screen.queryByText("Calligrapher")).toBeNull();
		fireEvent.change(screen.getByPlaceholderText("Search options…"), {
			target: { value: "calli" },
		});
		expect(screen.queryByText("Calligrapher")).toBeTruthy();
		// The fold toggle stands down while a query narrows the list.
		expect(screen.queryByText(/more…/u)).toBeNull();
	});
});

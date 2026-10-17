// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntityFilterField } from "#/filter/components/fields/entity-filter-field.tsx";
import type {
	EntityFilterDefinition,
	EntityFilterOption,
	EntityFilterValue,
} from "#/filter/types.ts";

const CUSTOMERS: ReadonlyArray<EntityFilterOption> = [
	{ id: "acme", label: "Acme" },
	{ id: "globex", label: "Globex" },
];

function definitionWith(
	searchOptions: EntityFilterDefinition["searchOptions"],
): EntityFilterDefinition {
	return {
		kind: "entity",
		key: "customer",
		label: "Customer",
		multiple: true,
		allowExclusion: true,
		searchOptions,
	};
}

function Fixture({
	definition,
}: {
	readonly definition: EntityFilterDefinition;
}) {
	const [value, setValue] = useState<EntityFilterValue | undefined>();
	return (
		<>
			<EntityFilterField
				definition={definition}
				value={value}
				onValueChange={setValue}
			/>
			<output>{JSON.stringify(value ?? null)}</output>
		</>
	);
}

afterEach(cleanup);

describe("EntityFilterField", () => {
	it("looks records up as you type and keeps the picked ones as chips", async () => {
		const searchOptions = vi.fn(async (query: string) =>
			CUSTOMERS.filter((customer) =>
				customer.label.toLowerCase().includes(query.toLowerCase()),
			),
		);
		const screen = render(
			<Fixture definition={definitionWith(searchOptions)} />,
		);

		fireEvent.change(screen.getByLabelText("Customer"), {
			target: { value: "ac" },
		});
		const result = await screen.findByRole("button", { name: "Acme" });
		expect(searchOptions).toHaveBeenCalledWith("ac");

		fireEvent.click(result);
		expect(screen.getByRole("button", { name: "Remove: Acme" })).toBeTruthy();
		expect(screen.getByRole("status").textContent).toContain('"id":"acme"');

		// "is not" now has something to invert.
		fireEvent.click(screen.getByRole("button", { name: "is not" }));
		expect(screen.getByRole("status").textContent).toContain('"excluded":true');

		fireEvent.click(screen.getByRole("button", { name: "Remove: Acme" }));
		expect(screen.getByRole("status").textContent).toBe("null");
	});

	it("says so when a lookup finds nothing, and survives a failing one", async () => {
		const screen = render(
			<Fixture
				definition={definitionWith(async () => {
					throw new Error("offline");
				})}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Customer"), {
			target: { value: "zz" },
		});
		await waitFor(() => {
			expect(screen.getByText("No results.")).toBeTruthy();
		});
	});
});

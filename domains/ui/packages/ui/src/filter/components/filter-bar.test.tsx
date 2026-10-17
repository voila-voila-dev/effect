// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterBar } from "#/filter/components/filter-bar.tsx";
import type { FilterDefinition, FilterValues } from "#/filter/types.ts";

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 375;

function setViewportWidth(width: number) {
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		writable: true,
		value: width,
	});
}

const definitions: ReadonlyArray<FilterDefinition> = [
	{ kind: "text", key: "recipient", label: "Recipient", allowExclusion: true },
	{
		kind: "select",
		key: "status",
		label: "Status",
		multiple: true,
		options: [
			{ value: "sent", label: "Sent" },
			{ value: "failed", label: "Failed" },
		],
	},
	{
		kind: "boolean",
		key: "opened",
		label: "Opened",
		trueLabel: "Opened",
		falseLabel: "Not opened",
	},
	{
		kind: "dateRange",
		key: "sentAt",
		label: "Sent",
		presets: [{ label: "Last 7 days", from: "2026-07-29", to: "2026-08-04" }],
	},
];

function Fixture({ initial = {} }: { initial?: FilterValues }) {
	const [values, setValues] = useState<FilterValues>(initial);
	const [search, setSearch] = useState("");
	return (
		<FilterBar
			definitions={definitions}
			values={values}
			onValuesChange={setValues}
			searchValue={search}
			onSearchChange={setSearch}
			resultCount={12}
		/>
	);
}

beforeEach(() => {
	setViewportWidth(DESKTOP_WIDTH);
	// jsdom has no matchMedia; `useIsMobile` (desktop half) needs it.
	vi.stubGlobal(
		"matchMedia",
		vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			addEventListener: () => {},
			removeEventListener: () => {},
		})),
	);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("FilterBar", () => {
	it("shows the result count and no chips while nothing is filtered", () => {
		const screen = render(<Fixture />);
		expect(screen.getByText("12 results")).toBeTruthy();
		expect(
			screen.baseElement.querySelector("[data-slot=filter-chips]"),
		).toBeNull();
	});

	it("describes an applied filter on a chip", () => {
		const screen = render(
			<Fixture initial={{ status: { kind: "select", values: ["failed"] } }} />,
		);
		expect(screen.getByText("Status is Failed")).toBeTruthy();
	});

	it("removes a filter from its chip", async () => {
		const screen = render(
			<Fixture initial={{ status: { kind: "select", values: ["failed"] } }} />,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Remove: Status is Failed" }),
		);
		await waitFor(() => {
			expect(screen.queryByText("Status is Failed")).toBeNull();
		});
	});

	it("opens the editor from the trigger", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});
		expect(screen.getByLabelText("Recipient")).toBeTruthy();
	});

	it("keeps the is/is not switch inert until the field has a value", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});
		// "is not <nothing>" filters nothing, so an empty field can't be inverted.
		expect(screen.getByRole("button", { name: "is not" })).toHaveProperty(
			"disabled",
			true,
		);

		fireEvent.change(screen.getByLabelText("Recipient"), {
			target: { value: "camille" },
		});
		await waitFor(() => {
			expect(screen.getByRole("button", { name: "is not" })).toHaveProperty(
				"disabled",
				false,
			);
		});
	});

	it("does not focus the search box on open", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});
		// Focusing it would throw the phone keyboard over the filters.
		expect(document.activeElement).not.toBe(
			screen.getByRole("searchbox", { name: "Search" }),
		);
	});

	it("only applies the draft once Apply is pressed", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});

		fireEvent.click(screen.getByRole("option", { name: "Failed" }));
		expect(screen.queryByText("Status is Failed")).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: "Apply" }));
		await waitFor(() => {
			expect(screen.getByText("Status is Failed")).toBeTruthy();
		});
	});

	it("discards the draft when the editor is dismissed", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});
		fireEvent.click(screen.getByRole("option", { name: "Failed" }));
		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).toBeNull();
		});
		expect(screen.queryByText("Status is Failed")).toBeNull();
	});

	describe("on mobile", () => {
		beforeEach(() => {
			setViewportWidth(MOBILE_WIDTH);
		});

		it("edits in a drawer, with native date inputs", async () => {
			const screen = render(<Fixture />);
			fireEvent.click(screen.getByRole("button", { name: "Filters" }));
			await waitFor(() => {
				expect(
					screen.baseElement.querySelector("[data-slot=drawer-content]"),
				).not.toBeNull();
			});
			expect(
				screen.baseElement.querySelector("[data-slot=dialog-content]"),
			).toBeNull();
			expect(
				screen.baseElement.querySelectorAll("[data-slot=native-date-picker]")
					.length,
			).toBe(2);
		});
	});

	it("keeps a false boolean as an active filter", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});
		fireEvent.click(screen.getByRole("option", { name: "Not opened" }));
		fireEvent.click(screen.getByRole("button", { name: "Apply" }));

		await waitFor(() => {
			expect(screen.getByText("Opened: Not opened")).toBeTruthy();
		});
	});
});

describe("FilterBar in live mode", () => {
	function LiveFixture({ initial = {} }: { initial?: FilterValues }) {
		const [values, setValues] = useState<FilterValues>(initial);
		const [search, setSearch] = useState("");
		return (
			<FilterBar
				mode="live"
				definitions={definitions}
				values={values}
				onValuesChange={setValues}
				searchValue={search}
				onSearchChange={setSearch}
				resultCount={12}
			/>
		);
	}

	async function openEditor(screen: ReturnType<typeof render>) {
		fireEvent.click(screen.getByRole("button", { name: "Filters" }));
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});
	}

	it("searches from the bar itself, one keystroke at a time", () => {
		const screen = render(<LiveFixture />);
		const input = screen.getByRole("textbox", { name: "Search" });
		fireEvent.change(input, { target: { value: "camille" } });
		expect((input as HTMLInputElement).value).toBe("camille");
	});

	it("opens the editor from outside the bar and closes it from its footer", async () => {
		function ControlledFixture() {
			const [open, setOpen] = useState(false);
			const [values, setValues] = useState<FilterValues>({});
			return (
				<>
					<button type="button" onClick={() => setOpen(true)}>
						Edit my preferences
					</button>
					<FilterBar
						mode="live"
						definitions={definitions}
						values={values}
						onValuesChange={setValues}
						open={open}
						onOpenChange={setOpen}
					/>
				</>
			);
		}
		const screen = render(<ControlledFixture />);
		expect(screen.queryByRole("dialog")).toBeNull();

		fireEvent.click(
			screen.getByRole("button", { name: "Edit my preferences" }),
		);
		await waitFor(() => {
			expect(screen.getByRole("dialog")).toBeTruthy();
		});

		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		await waitFor(() => {
			expect(screen.queryByRole("dialog")).toBeNull();
		});
	});

	it("applies a discrete change immediately, without an Apply step", async () => {
		const screen = render(<LiveFixture />);
		await openEditor(screen);

		fireEvent.click(screen.getByRole("option", { name: "Failed" }));
		await waitFor(() => {
			expect(screen.getByText("Status is Failed")).toBeTruthy();
		});
		expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
	});

	it("debounces a typed filter before applying it", async () => {
		const screen = render(<LiveFixture />);
		await openEditor(screen);

		fireEvent.change(screen.getByLabelText("Recipient"), {
			target: { value: "camille" },
		});
		// A half-typed filter must not refetch the list on every keystroke…
		expect(screen.queryByText("Recipient is camille")).toBeNull();
		// …but the pause after typing commits it.
		await waitFor(() => {
			expect(screen.getByText("Recipient is camille")).toBeTruthy();
		});
	});

	it("keeps the applied filters when the editor is dismissed", async () => {
		const screen = render(<LiveFixture />);
		await openEditor(screen);
		fireEvent.click(screen.getByRole("option", { name: "Failed" }));
		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

		await waitFor(() => {
			expect(screen.queryByRole("dialog")).toBeNull();
		});
		expect(screen.getByText("Status is Failed")).toBeTruthy();
	});

	it("sets both bounds from a date-range preset", async () => {
		const screen = render(<LiveFixture />);
		await openEditor(screen);

		const preset = screen.getByRole("button", { name: "Last 7 days" });
		fireEvent.click(preset);
		expect(preset.getAttribute("aria-pressed")).toBe("true");

		await waitFor(() => {
			expect(screen.getByText(/^Sent: /u)).toBeTruthy();
		});
	});

	it("keeps a false boolean as an active filter", async () => {
		const screen = render(<LiveFixture />);
		await openEditor(screen);
		fireEvent.click(screen.getByRole("option", { name: "Not opened" }));

		await waitFor(() => {
			expect(screen.getByText("Opened: Not opened")).toBeTruthy();
		});
	});

	it("finds a filter by name once the editor is searchable", async () => {
		const manyDefinitions: ReadonlyArray<FilterDefinition> = [
			...definitions,
			{ kind: "text", key: "subject", label: "Subject" },
			{ kind: "text", key: "reference", label: "Référence" },
		];
		function ManyFixture() {
			const [values, setValues] = useState<FilterValues>({});
			return (
				<FilterBar
					mode="live"
					definitions={manyDefinitions}
					values={values}
					onValuesChange={setValues}
				/>
			);
		}
		const screen = render(<ManyFixture />);
		await openEditor(screen);

		// Accent-blind: "refe" finds « Référence ».
		fireEvent.change(screen.getByPlaceholderText("Search filters…"), {
			target: { value: "refe" },
		});
		expect(screen.getByText("Référence")).toBeTruthy();
		expect(screen.queryByText("Subject")).toBeNull();

		fireEvent.change(screen.getByPlaceholderText("Search filters…"), {
			target: { value: "zzz" },
		});
		expect(screen.getByText("No filter matches.")).toBeTruthy();
	});

	it("hides the chips row and leaves the editor to a docked panel", async () => {
		function DockedFixture() {
			const [open, setOpen] = useState(false);
			return (
				<>
					<FilterBar
						mode="live"
						definitions={definitions}
						values={{ status: { kind: "select", values: ["failed"] } }}
						onValuesChange={() => {}}
						open={open}
						onOpenChange={setOpen}
						hideChips
						panelRenderedElsewhere
					/>
					<output>{open ? "docked open" : "docked closed"}</output>
				</>
			);
		}
		const screen = render(<DockedFixture />);
		expect(screen.queryByText("Status is Failed")).toBeNull();

		const button = screen.getByRole("button", { name: /Filters/u });
		fireEvent.click(button);
		expect(screen.getByText("docked open")).toBeTruthy();
		expect(button.getAttribute("aria-pressed")).toBe("true");
		// The bar draws no editor of its own.
		expect(screen.queryByRole("dialog")).toBeNull();

		fireEvent.click(button);
		expect(screen.getByText("docked closed")).toBeTruthy();
	});
});

describe("FilterBar labels", () => {
	it("merges partial overrides over the English defaults", () => {
		const screen = render(
			<FilterBar
				definitions={definitions}
				values={{ status: { kind: "select", values: ["failed"] } }}
				onValuesChange={() => {}}
				resultCount={3}
				labels={{ is: "est", resultCount: (count) => `${count} résultats` }}
			/>,
		);
		expect(screen.getByText("Status est Failed")).toBeTruthy();
		expect(screen.getByText("3 résultats")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
	});
});

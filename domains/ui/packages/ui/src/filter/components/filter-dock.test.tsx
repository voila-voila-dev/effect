// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterDock } from "#/filter/components/filter-dock.tsx";
import type { FilterDefinition, FilterValues } from "#/filter/types.ts";

const definitions: ReadonlyArray<FilterDefinition> = [
	{
		kind: "select",
		key: "status",
		label: "Status",
		options: [
			{ value: "sent", label: "Sent" },
			{ value: "failed", label: "Failed" },
		],
	},
	{ kind: "text", key: "recipient", label: "Recipient" },
];

function Fixture({ initialOpen = true }: { initialOpen?: boolean }) {
	const [open, setOpen] = useState(initialOpen);
	const [values, setValues] = useState<FilterValues>({});
	return (
		<>
			<button type="button" onClick={() => setOpen(!open)}>
				Toggle
			</button>
			<FilterDock
				open={open}
				onOpenChange={setOpen}
				definitions={definitions}
				values={values}
				onValuesChange={setValues}
			/>
		</>
	);
}

function setViewportWidth(width: number) {
	Object.defineProperty(window, "innerWidth", {
		configurable: true,
		writable: true,
		value: width,
	});
}

beforeEach(() => {
	// Pinned desktop: `useIsMobile` decides between the rail and the drawer.
	setViewportWidth(1280);
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

describe("FilterDock", () => {
	it("renders the fields inline, not in a dialog", () => {
		const screen = render(<Fixture />);
		expect(
			screen.baseElement.querySelector("[data-slot=filter-dock]"),
		).not.toBeNull();
		// A rail is part of the page: nothing to dismiss before reading the rows.
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(screen.getByRole("option", { name: "Failed" })).toBeTruthy();
	});

	it("renders nothing while closed", () => {
		const screen = render(<Fixture initialOpen={false} />);
		expect(
			screen.baseElement.querySelector("[data-slot=filter-dock]"),
		).toBeNull();
	});

	it("applies a change without closing", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("option", { name: "Failed" }));
		await waitFor(() => {
			expect(
				screen
					.getByRole("option", { name: "Failed" })
					.getAttribute("aria-selected"),
			).toBe("true");
		});
		expect(
			screen.baseElement.querySelector("[data-slot=filter-dock]"),
		).not.toBeNull();
	});

	it("closes from its own header", async () => {
		const screen = render(<Fixture />);
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		await waitFor(() => {
			expect(
				screen.baseElement.querySelector("[data-slot=filter-dock]"),
			).toBeNull();
		});
	});

	describe("on mobile", () => {
		beforeEach(() => {
			// `useIsMobile` reads the width, not the query's own `matches`.
			setViewportWidth(375);
		});

		it("falls back to the drawer, where a rail would leave no room", async () => {
			const screen = render(<Fixture />);
			await waitFor(() => {
				expect(
					screen.baseElement.querySelector("[data-slot=drawer-content]"),
				).not.toBeNull();
			});
			expect(
				screen.baseElement.querySelector("[data-slot=filter-dock]"),
			).toBeNull();
		});
	});
});

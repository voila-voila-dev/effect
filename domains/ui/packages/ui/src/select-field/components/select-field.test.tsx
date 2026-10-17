// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SelectField } from "#/select-field/components/select-field.tsx";

beforeEach(() => {
	// Base UI's Positioner measures the anchor with ResizeObserver, absent in jsdom.
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	// `ResponsiveSelect` asks `useIsMobile`; jsdom has no matchMedia, and the
	// default 1024px width keeps it on the desktop popup.
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: false,
		media: query,
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
	}));
});

afterEach(cleanup);

type Props = React.ComponentProps<typeof SelectField>;

const options = [
	{ value: "1", label: "Étude" },
	{ value: "2", label: "Massage" },
];

function creatable(overrides: Partial<Props> = {}): Props {
	return {
		options,
		value: null,
		onValueChange: () => undefined,
		onCreate: () => undefined,
		createLabel: (query) => `Add "${query}"`,
		placeholder: "Pick or type",
		...overrides,
	};
}

function input(): HTMLElement {
	return screen.getByPlaceholderText("Pick or type");
}

/** Base UI only mounts the popup once opened; the caret trigger opens it. */
function open(): void {
	fireEvent.click(screen.getByRole("button", { name: "Open list" }));
}

function type(value: string): void {
	open();
	fireEvent.change(input(), { target: { value } });
}

describe("creatable SelectField", () => {
	it("offers to create what was typed when nothing matches", async () => {
		render(<SelectField {...creatable()} />);
		type("Strapping");
		expect(await screen.findByText('Add "Strapping"')).toBeDefined();
	});

	it("keeps the create row while narrowing to a partial match", async () => {
		render(<SelectField {...creatable()} />);
		type("Étu");
		expect(await screen.findByText("Étude")).toBeDefined();
		expect(await screen.findByText('Add "Étu"')).toBeDefined();
	});

	it("matches accents-insensitively instead of showing an empty list", async () => {
		render(<SelectField {...creatable()} />);
		type("etude");
		expect(await screen.findByText("Étude")).toBeDefined();
	});

	it("does not offer a twin of an option that already exists", async () => {
		render(<SelectField {...creatable()} />);
		type("massage");
		expect(await screen.findByText("Massage")).toBeDefined();
		expect(screen.queryByText('Add "massage"')).toBeNull();
	});

	it("says what an empty catalog means instead of opening a bare box", async () => {
		render(
			<SelectField
				{...creatable({
					options: [],
					emptyHint: "No people yet. Type a name.",
				})}
			/>,
		);
		open();
		expect(
			await screen.findByText("No people yet. Type a name."),
		).toBeDefined();
	});

	it("hands the typed text to onCreate when the create row is taken", async () => {
		const onCreate = vi.fn();
		render(<SelectField {...creatable({ onCreate })} />);
		type("Strapping");
		fireEvent.click(await screen.findByText('Add "Strapping"'));
		expect(onCreate).toHaveBeenCalledWith("Strapping");
	});

	it("labels the create row in English by default", async () => {
		render(<SelectField {...creatable({ createLabel: undefined })} />);
		type("Strapping");
		expect(await screen.findByText('Create "Strapping"')).toBeDefined();
	});
});

describe("closed SelectField", () => {
	it("renders a select trigger with the placeholder", () => {
		render(
			<SelectField
				options={options}
				value={null}
				onValueChange={() => undefined}
				placeholder="Pick one"
				testId="kind"
			/>,
		);
		const trigger = screen.getByTestId("kind");
		expect(trigger.dataset.slot).toBe("select-field");
		expect(trigger.textContent).toContain("Pick one");
	});

	it("emits null when the explicit none row is chosen", () => {
		// The phone's native select: the same rows, picked with a change event.
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			writable: true,
			value: 375,
		});
		const onValueChange = vi.fn();
		try {
			render(
				<SelectField
					options={options}
					value="1"
					onValueChange={onValueChange}
					nullOption={{ label: "None" }}
				/>,
			);
			const select = screen.getByRole("combobox");
			const none = screen.getByRole("option", { name: "None" });
			if (!(none instanceof HTMLOptionElement)) {
				throw new Error("expected a native option");
			}
			fireEvent.change(select, { target: { value: none.value } });
			expect(onValueChange).toHaveBeenCalledWith(null);
		} finally {
			Object.defineProperty(window, "innerWidth", {
				configurable: true,
				writable: true,
				value: 1024,
			});
		}
	});

	it("takes the lg height as a class", () => {
		render(
			<SelectField
				options={options}
				value={null}
				onValueChange={() => undefined}
				size="lg"
				testId="kind"
			/>,
		);
		expect(screen.getByTestId("kind").classList.contains("h-9")).toBe(true);
	});
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExpandingTextareaInput } from "#/expanding-textarea-input/components/expanding-textarea-input.tsx";

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
});

afterEach(cleanup);

describe("ExpandingTextareaInput", () => {
	it("previews only the first line of a multi-line value", () => {
		const view = render(
			<ExpandingTextareaInput
				value={"Line one\nLine two"}
				onValueChange={() => undefined}
				ariaLabel="Description"
			/>,
		);
		const trigger = view.getByRole("button", { name: "Description" });
		expect(trigger.textContent).toContain("Line one");
		expect(trigger.textContent).not.toContain("Line two");
	});

	it("flags an empty value and previews the placeholder instead", () => {
		const view = render(
			<ExpandingTextareaInput
				value="  "
				onValueChange={() => undefined}
				ariaLabel="Description"
				placeholder="e.g. a note"
			/>,
		);
		const trigger = view.getByRole("button", { name: "Description" });
		expect(trigger.dataset.empty).toBe("true");
		expect(trigger.textContent).toContain("e.g. a note");
	});

	it("opens a textarea whose edits flow through onValueChange", async () => {
		const onValueChange = vi.fn();
		const view = render(
			<ExpandingTextareaInput
				value="Before"
				onValueChange={onValueChange}
				ariaLabel="Description"
			/>,
		);
		fireEvent.click(view.getByRole("button", { name: "Description" }));
		const textarea = await waitFor(() =>
			view.getByRole("textbox", { name: "Description" }),
		);
		if (!(textarea instanceof HTMLTextAreaElement)) {
			throw new Error("expected a textarea");
		}
		expect(textarea.value).toBe("Before");
		fireEvent.change(textarea, { target: { value: "Before\nAfter" } });
		expect(onValueChange).toHaveBeenCalledWith("Before\nAfter");
	});

	it("closes the editor on ⌘Enter", async () => {
		const view = render(
			<ExpandingTextareaInput
				value="Text"
				onValueChange={() => undefined}
				ariaLabel="Description"
			/>,
		);
		fireEvent.click(view.getByRole("button", { name: "Description" }));
		const textarea = await waitFor(() =>
			view.getByRole("textbox", { name: "Description" }),
		);
		fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
		await waitFor(() => {
			expect(view.queryByRole("textbox", { name: "Description" })).toBeNull();
		});
	});
});

import { afterEach, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { mdxComponents } from "./mdx-components.tsx";

afterEach(cleanup);

const { Preview } = mdxComponents;

it("frames the example outside the page's prose, under its label", () => {
	const { container } = render(
		<Preview label="Sizes">
			<button type="button">Save</button>
		</Preview>,
	);
	const frame = container.firstElementChild;
	expect(frame?.className).toContain("not-prose");
	expect(frame?.querySelector(".docs-preview-label")?.textContent).toBe(
		"Sizes",
	);
	expect(
		frame?.querySelector(".docs-preview-stage")?.getAttribute("data-layout"),
	).toBe("row");
});

it("lays the examples out as asked, and scrolls a wide one in its frame", () => {
	const { container } = render(
		<Preview layout="stack" scroll>
			<div>Wide</div>
		</Preview>,
	);
	const frame = container.firstElementChild;
	expect(frame?.className).toContain("docs-preview-scroll");
	expect(frame?.querySelector(".docs-preview-label")).toBeNull();
	expect(
		frame?.querySelector(".docs-preview-stage")?.getAttribute("data-layout"),
	).toBe("stack");
});

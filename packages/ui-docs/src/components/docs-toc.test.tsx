import { afterEach, describe, expect, it, spyOn } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { TestDocsProvider } from "./docs-provider.test-helper.tsx";
import { DocsToc } from "./docs-toc.tsx";

afterEach(cleanup);

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("DocsToc", () => {
	// A guide's index has no h2 or h3. Its outline used to watch the heading
	// id "", and every scroll asked the document for the selector "#", which
	// throws (site error group 6691a3184c40a6cf, 2026-10-15).
	it("watches nothing on a page without a section", async () => {
		// A page long enough to scroll, read from its top: the outline only
		// looks for headings when the reader is not at the bottom.
		Object.defineProperty(document.documentElement, "scrollHeight", {
			configurable: true,
			value: 5000,
		});
		const querySelector = spyOn(document, "querySelector");
		const { container } = render(
			<TestDocsProvider tabs={[]} pathname="/docs/teams">
				<DocsToc headings={[]} />
			</TestDocsProvider>,
		);
		window.dispatchEvent(new Event("scroll"));
		await nextFrame();

		expect(container.querySelector("nav")).toBeNull();
		expect(
			querySelector.mock.calls.map(([selector]) => selector),
		).not.toContain("#");
		querySelector.mockRestore();
		Reflect.deleteProperty(document.documentElement, "scrollHeight");
	});
});

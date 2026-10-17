import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { Suspense } from "react";

import { lazyContent } from "./lazy-content.ts";

afterEach(cleanup);

function Body() {
	return <p>The body</p>;
}

describe("lazyContent", () => {
	it("renders a preloaded body without suspending", async () => {
		const { Content, preloadContent } = lazyContent(() =>
			Promise.resolve(Body),
		);
		await preloadContent();

		const view = render(
			<Suspense fallback={<p>Loading</p>}>
				<Content />
			</Suspense>,
		);

		expect(view.container.textContent).toBe("The body");
	});

	it("suspends on a body nothing preloaded, then renders it", async () => {
		const { Content } = lazyContent(() => Promise.resolve(Body));

		const view = render(
			<Suspense fallback={<p>Loading</p>}>
				<Content />
			</Suspense>,
		);

		expect(view.container.textContent).toBe("Loading");
		expect(await view.findByText("The body")).toBeDefined();
	});
});

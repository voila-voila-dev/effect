import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";

import { TestDocsProvider } from "./docs-provider.test-helper.tsx";
import { MobileNavigation } from "./mobile-navigation.tsx";

afterEach(cleanup);

describe("MobileNavigation", () => {
	it("opens the drawer on the first click, before the drawer has loaded", async () => {
		const view = render(
			<TestDocsProvider tabs={[]} pathname="/docs">
				<MobileNavigation />
			</TestDocsProvider>,
		);
		fireEvent.click(view.getByRole("button", { name: "menu" }));

		await waitFor(() =>
			expect(view.getByRole("dialog").textContent).toContain("title"),
		);
	});
});

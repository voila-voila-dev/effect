import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";

import { TestDocsProvider } from "./docs-provider.test-helper.tsx";
import { PageActions } from "./page-actions.tsx";

afterEach(cleanup);

describe("PageActions", () => {
	it("opens its menu on the first click, before the menu has loaded", async () => {
		const view = render(
			<TestDocsProvider tabs={[]} pathname="/docs">
				<PageActions
					source={() => Promise.resolve("# Page")}
					url="https://example.com/docs"
				/>
			</TestDocsProvider>,
		);
		fireEvent.click(view.getByRole("button", { name: "pageActionsAria" }));

		await waitFor(() =>
			expect(
				view.getAllByRole("menuitem").map((item) => item.textContent),
			).toEqual([
				"copyPagecopyPageHint",
				"viewMarkdownviewMarkdownHint",
				"openChatgptaskAboutPage",
				"openClaudeaskAboutPage",
			]),
		);
	});
});

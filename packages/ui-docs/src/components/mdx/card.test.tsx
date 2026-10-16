import { afterEach, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { TestDocsProvider } from "../docs-provider.test-helper.tsx";
import { mdxComponents } from "./mdx-components.tsx";

afterEach(cleanup);

const { a: Anchor, Card } = mdxComponents;

function renderCard(href: string | undefined) {
	return render(
		<TestDocsProvider tabs={[]} pathname="/docs">
			<Card title="A question?" {...(href === undefined ? {} : { href })}>
				Write to us at{" "}
				<Anchor href="mailto:contact@example.com">contact@example.com</Anchor>.
			</Card>
		</TestDocsProvider>,
	);
}

it("keeps a link in a linked card's text as plain text, so links never nest", () => {
	const { container } = renderCard("mailto:contact@example.com");
	expect(
		[...container.querySelectorAll("a")].map((a) => a.getAttribute("href")),
	).toEqual(["mailto:contact@example.com"]);
	expect(container.textContent).toContain(
		"Write to us at contact@example.com.",
	);
});

it("keeps the link in a card that links nowhere", () => {
	const { container } = renderCard(undefined);
	expect(
		[...container.querySelectorAll("a")].map((a) => a.getAttribute("href")),
	).toEqual(["mailto:contact@example.com"]);
});

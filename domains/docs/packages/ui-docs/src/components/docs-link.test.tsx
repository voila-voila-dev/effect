import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { DocsLink } from "./docs-link.tsx";
import { TestDocsProvider } from "./docs-provider.test-helper.tsx";

afterEach(cleanup);

function linkTo(href: string): HTMLAnchorElement | null {
	return render(
		<TestDocsProvider tabs={[]} pathname="/docs">
			<DocsLink href={href}>link</DocsLink>
		</TestDocsProvider>,
	).container.querySelector("a");
}

describe("DocsLink", () => {
	it("hands a path inside the site to the host's router", () => {
		const link = linkTo("/docs/teams#steps");

		expect(link?.hasAttribute("data-router")).toBe(true);
		expect(link?.getAttribute("target")).toBeNull();
	});

	it("opens another site in a new tab", () => {
		const link = linkTo("https://example.com");

		expect(link?.hasAttribute("data-router")).toBe(false);
		expect(link?.getAttribute("target")).toBe("_blank");
		expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
	});
});

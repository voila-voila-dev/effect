import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import type { NavTab } from "@voila.dev/docs/navigation";

import { TestDocsProvider } from "./docs-provider.test-helper.tsx";
import { DocsSidebar } from "./docs-sidebar.tsx";

const longTitle = "Search the project catalog by label, team and name";

const tabs: Array<NavTab> = [
	{
		label: "Guides",
		href: "/docs",
		audiences: [],
		groups: [
			{
				label: "Start",
				items: [
					{ title: "Introduction", href: "/docs", icon: "book" },
					{
						label: "Folder",
						items: [{ title: "Inside", href: "/docs/inside" }],
					},
					{ title: "Other folder page", href: "/docs/other" },
				],
			},
			{
				label: "Projects",
				items: [
					{
						title: longTitle,
						href: "/docs/api/projects/list",
						method: "post",
					},
				],
			},
		],
	},
];

function renderAt(pathname: string) {
	return render(
		<TestDocsProvider tabs={tabs} pathname={pathname}>
			<DocsSidebar />
		</TestDocsProvider>,
	);
}

afterEach(cleanup);

describe("DocsSidebar", () => {
	it("marks the current page and routes its links", () => {
		const { getByText } = renderAt("/docs/other");
		const link = getByText("Other folder page").closest("a");

		expect(link?.getAttribute("aria-current")).toBe("page");
		expect(link?.hasAttribute("data-router")).toBe(true);
	});

	it("opens the folder that holds the current page only", () => {
		const { container, rerender } = renderAt("/docs/inside");

		expect(container.querySelector("details")?.open).toBe(true);
		rerender(
			<TestDocsProvider tabs={tabs} pathname="/docs">
				<DocsSidebar />
			</TestDocsProvider>,
		);
		expect(container.querySelector("details")?.open).toBe(false);
	});

	it("wraps a long title onto a second line instead of cutting it", () => {
		const { getByText } = renderAt("/docs");
		const title = getByText(longTitle);
		const link = title.closest("a");

		expect(title.className).not.toContain("truncate");
		expect(link?.className).not.toContain("whitespace-nowrap");
		expect(link?.className).toContain("min-h-8");
		expect(link?.textContent).toBe(`post${longTitle}`);
	});
});

describe("DocsSidebar audiences", () => {
	const groups = [
		{
			label: "Your account",
			items: [{ title: "Create your account", href: "/docs/account/create" }],
		},
		{
			label: "Get started",
			audience: "teams",
			items: [{ title: "Overview", href: "/docs/teams" }],
		},
		{
			label: "Projects",
			audience: "teams",
			items: [{ title: "Invite", href: "/docs/teams/invite" }],
		},
		{
			label: "Get started",
			audience: "developers",
			items: [{ title: "Overview", href: "/docs/developers" }],
		},
		{
			label: "Projects",
			audience: "developers",
			items: [
				{
					title: "Connect an integration",
					sidebarTitle: "Connect",
					href: "/docs/developers/connect",
				},
			],
		},
	];
	const audiences = [
		{ id: "teams", label: "Teams", href: "/docs/teams" },
		{ id: "developers", label: "Developers", href: "/docs/developers" },
	];
	const audienceTabs: Array<NavTab> = [
		{ label: "Guides", href: "/docs", audiences, groups },
	];
	const emptyTab: NavTab = { label: "", href: "", audiences: [], groups: [] };

	function group(index: number): (typeof groups)[number] {
		const found = groups[index];
		if (!found) {
			throw new Error(`no group at ${index}`);
		}
		return found;
	}

	function renderOn(pathname: string, group: (typeof groups)[number]) {
		const item = group.items[0] ?? { title: "", href: "" };
		return render(
			<TestDocsProvider
				tabs={audienceTabs}
				pathname={pathname}
				location={{
					tab: audienceTabs[0] ?? emptyTab,
					group,
					folders: [],
					item,
				}}
			>
				<DocsSidebar />
			</TestDocsProvider>,
		);
	}

	function headings(container: HTMLElement, level: "h2" | "h3"): Array<string> {
		return [...container.querySelectorAll(level)].map(
			(heading) => heading.textContent ?? "",
		);
	}

	it("shows the account group and the topics of the page's audience only", () => {
		const { container } = renderOn("/docs/teams/invite", group(2));

		expect(headings(container, "h2")).toEqual([
			"Your account",
			"Get started",
			"Projects",
		]);
		expect(container.textContent).not.toContain("Connect");
	});

	it("switches audience through each audience's landing", () => {
		const { getByRole } = renderOn("/docs/teams/invite", group(2));
		const switcher = getByRole("navigation", { name: "audienceSwitcherAria" });

		expect(
			[...switcher.querySelectorAll("a")].map((link) => [
				link.textContent,
				link.getAttribute("href"),
				link.getAttribute("aria-current"),
			]),
		).toEqual([
			["Teams", "/docs/teams", "true"],
			["Developers", "/docs/developers", null],
		]);
	});

	it("shows a page's sidebar title, its full title in the tooltip", () => {
		const { getByText } = renderOn("/docs/developers/connect", group(4));

		expect(getByText("Connect").getAttribute("title")).toBe(
			"Connect an integration",
		);
	});

	it("names each audience over its topics on an account page before any audience is chosen", () => {
		window.localStorage.clear();
		const { container } = renderOn("/docs/account/create", group(0));

		expect(headings(container, "h2")).toEqual([
			"Your account",
			"Teams",
			"Developers",
		]);
		expect(headings(container, "h3")).toEqual([
			"Get started",
			"Projects",
			"Get started",
			"Projects",
		]);
	});
});

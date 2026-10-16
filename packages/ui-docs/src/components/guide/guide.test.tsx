import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { DocsFooter } from "../docs-footer.tsx";
import {
	DocsGuideProvider,
	type DocsPageGuide,
	type DocsPathView,
} from "../docs-guide.tsx";
import { TestDocsProvider } from "../docs-provider.test-helper.tsx";
import { AudienceIndex } from "../mdx/audience-index.tsx";
import { CodeValue } from "../mdx/code-value.tsx";
import { PathSteps } from "../mdx/path-steps.tsx";
import { NextSteps } from "./next-steps.tsx";
import { PathProgress } from "./path-progress.tsx";
import { Prerequisites } from "./prerequisites.tsx";
import { Sources } from "./sources.tsx";
import { UsedInPaths } from "./used-in-paths.tsx";

const firstInvoice: DocsPathView = {
	id: "first-invoice",
	title: "From sign-up to first invoice",
	href: "/docs/dev/first-invoice",
	steps: [
		{
			title: "Create your account",
			href: "/docs/account/create?path=first-invoice",
			context: "Already have an account? Skip to step 2.",
		},
		{
			title: "Choose your company type",
			href: "/docs/dev/company?path=first-invoice",
		},
		{
			title: "Create your profile",
			href: "/docs/dev/profile?path=first-invoice",
		},
	],
};

const empty: DocsPageGuide = {
	prerequisites: [],
	next: [],
	usedIn: [],
	sources: [],
	variants: [],
};

function renderWith(guide: Partial<DocsPageGuide>, children: ReactNode) {
	return render(
		<TestDocsProvider
			tabs={[]}
			pathname="/docs/dev/company"
			constants={{ reviewWindow: "72 hours" }}
		>
			<DocsGuideProvider guide={{ ...empty, ...guide }}>
				{children}
			</DocsGuideProvider>
		</TestDocsProvider>,
	);
}

function linksIn(element: HTMLElement): Array<[string | null, string | null]> {
	return [...element.querySelectorAll("a")].map((anchor) => [
		anchor.textContent || anchor.getAttribute("aria-label"),
		anchor.getAttribute("href"),
	]);
}

afterEach(cleanup);

describe("PathProgress", () => {
	it("says which step of which path the page is, and links every step", () => {
		const { container } = renderWith(
			{ place: { path: firstInvoice, index: 1 } },
			<PathProgress />,
		);

		expect(container.querySelector("p")?.textContent).toBe(
			"pathProgress·From sign-up to first invoice",
		);
		expect(linksIn(container)).toEqual([
			["From sign-up to first invoice", "/docs/dev/first-invoice"],
			["Create your account", "/docs/account/create?path=first-invoice"],
			["Choose your company type", "/docs/dev/company?path=first-invoice"],
			["Create your profile", "/docs/dev/profile?path=first-invoice"],
		]);
		expect(
			container.querySelector('[aria-current="step"]')?.getAttribute("href"),
		).toBe("/docs/dev/company?path=first-invoice");
	});

	it("shows the step's context line", () => {
		const { getByText } = renderWith(
			{ place: { path: firstInvoice, index: 0 } },
			<PathProgress />,
		);

		expect(getByText("Already have an account? Skip to step 2.")).toBeTruthy();
	});

	it("renders nothing outside a path", () => {
		const { container } = renderWith({}, <PathProgress />);

		expect(container.innerHTML).toBe("");
	});
});

describe("Prerequisites", () => {
	it("lists what to do before, as links", () => {
		const { container } = renderWith(
			{
				prerequisites: [
					{ title: "Create your account", href: "/docs/account/create" },
				],
			},
			<Prerequisites />,
		);

		expect(container.textContent).toBe("prerequisitesTitleCreate your account");
		expect(linksIn(container)).toEqual([
			["Create your account", "/docs/account/create"],
		]);
	});

	it("renders nothing when the page needs nothing before", () => {
		expect(renderWith({}, <Prerequisites />).container.innerHTML).toBe("");
	});
});

describe("NextSteps", () => {
	it("shows the page's next pages, then the path's next step", () => {
		const { container } = renderWith(
			{
				next: [{ title: "Notifications", href: "/docs/account/notifications" }],
				place: { path: firstInvoice, index: 1 },
			},
			<NextSteps />,
		);

		expect(linksIn(container)).toEqual([
			["Notifications", "/docs/account/notifications"],
			["Create your profile", "/docs/dev/profile?path=first-invoice"],
		]);
	});

	it("does not repeat the path's next step when `next` names it", () => {
		const { container } = renderWith(
			{
				next: [{ title: "Create your profile", href: "/docs/dev/profile" }],
				place: { path: firstInvoice, index: 1 },
			},
			<NextSteps />,
		);

		expect(linksIn(container)).toEqual([
			["Create your profile", "/docs/dev/profile"],
		]);
	});

	it("renders nothing at the end of everything", () => {
		expect(renderWith({}, <NextSteps />).container.innerHTML).toBe("");
	});
});

describe("UsedInPaths", () => {
	it("links the paths that use the block", () => {
		const { container } = renderWith(
			{ usedIn: [firstInvoice] },
			<UsedInPaths />,
		);

		expect(linksIn(container)).toEqual([
			["From sign-up to first invoice", "/docs/dev/first-invoice"],
		]);
	});
});

describe("Sources", () => {
	it("links the official pages and says when they were read", () => {
		const { container } = renderWith(
			{
				sources: [
					{
						label: "The tax office's guide",
						href: "https://www.example.gov/guide",
					},
				],
				lastVerified: "2026-10-03",
			},
			<Sources />,
		);

		const link = container.querySelector("a");
		expect(link?.getAttribute("href")).toBe("https://www.example.gov/guide");
		expect(link?.getAttribute("target")).toBe("_blank");
		expect(container.querySelector("time")?.getAttribute("dateTime")).toBe(
			"2026-10-03",
		);
	});

	it("renders nothing on a page without sources", () => {
		expect(renderWith({}, <Sources />).container.innerHTML).toBe("");
	});
});

describe("DocsFooter", () => {
	it("follows the path when given its neighbours, and ends with the support contact", () => {
		const { container } = renderWith(
			{},
			<DocsFooter
				neighbours={{
					previous: firstInvoice.steps[0],
					next: firstInvoice.steps[2],
				}}
			/>,
		);

		expect(linksIn(container)).toEqual([
			[
				"previousCreate your account",
				"/docs/account/create?path=first-invoice",
			],
			["nextCreate your profile", "/docs/dev/profile?path=first-invoice"],
			["help@example.com", "mailto:help@example.com"],
		]);
		expect(container.textContent).toContain("stillStuckTitle");
	});
});

describe("AudienceIndex", () => {
	it("lists the paths, then the pages under each topic", () => {
		const { container } = renderWith(
			{
				audienceIndex: {
					audience: "developers",
					paths: [firstInvoice],
					planned: [],
					topics: [
						{
							label: "Profile and verification",
							pages: [
								{
									title: "Create your profile",
									href: "/docs/dev/profile",
									description: "Your trade and your address.",
								},
							],
						},
					],
				},
			},
			<AudienceIndex />,
		);

		expect(
			[...container.querySelectorAll("h2")].map(
				(heading) => heading.textContent,
			),
		).toEqual(["pathsTitle", "Profile and verification"]);
		expect(linksIn(container)).toEqual([
			["From sign-up to first invoicepathLength", "/docs/dev/first-invoice"],
			["Create your profileYour trade and your address.", "/docs/dev/profile"],
		]);
	});

	it("shows a planned path as coming, with nothing to open", () => {
		const { container } = renderWith(
			{
				audienceIndex: {
					audience: "developers",
					paths: [],
					planned: [
						{
							id: "luxembourg",
							title: "Work in Luxembourg",
							description: "What you need for a project in Luxembourg.",
						},
					],
					topics: [],
				},
			},
			<AudienceIndex />,
		);

		expect(container.querySelector("h2")?.textContent).toBe("pathsTitle");
		expect(container.textContent).toContain(
			"Work in LuxembourgplannedLabelWhat you need for a project in Luxembourg.",
		);
		expect(linksIn(container)).toEqual([]);
	});

	it("refuses a page that is no landing", () => {
		expect(() => renderWith({}, <AudienceIndex />)).toThrow(
			"<AudienceIndex /> belongs on a page the site declares as an audience landing",
		);
	});
});

describe("PathSteps", () => {
	it("lists the path's steps in order, each opening inside the path, with its context", () => {
		const { container } = renderWith(
			{ introduces: firstInvoice },
			<PathSteps />,
		);

		expect(linksIn(container)).toEqual([
			["Create your account", "/docs/account/create?path=first-invoice"],
			["Choose your company type", "/docs/dev/company?path=first-invoice"],
			["Create your profile", "/docs/dev/profile?path=first-invoice"],
		]);
		expect(container.querySelector("li")?.textContent).toBe(
			"Create your accountAlready have an account? Skip to step 2.",
		);
	});

	it("refuses a page that introduces no path", () => {
		expect(() => renderWith({}, <PathSteps />)).toThrow(
			"<PathSteps /> belongs on the page a path of the registry names",
		);
	});
});

describe("CodeValue", () => {
	it("prints the value the code holds", () => {
		expect(
			renderWith({}, <CodeValue name="reviewWindow" />).container.textContent,
		).toBe("72 hours");
	});

	it("fails the render on a name the site does not declare", () => {
		expect(() => renderWith({}, <CodeValue name="fee" />)).toThrow(
			'<CodeValue name="fee" /> names no docs constant (reviewWindow)',
		);
	});
});

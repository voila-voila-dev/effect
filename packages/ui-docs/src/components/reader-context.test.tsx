import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { NavTab } from "@voila.dev/docs/navigation";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { DocsGuideProvider } from "./docs-guide.tsx";
import { TestDocsProvider } from "./docs-provider.test-helper.tsx";
import type { DocsReaderContextConfig } from "./docs-provider.tsx";
import { DocsSidebar } from "./docs-sidebar.tsx";
import { AudienceIndex } from "./mdx/audience-index.tsx";
import { OnlyFor } from "./mdx/only-for.tsx";
import {
	ReaderContextAddress,
	ReaderContextPicker,
	useReaderContext,
} from "./reader-context.tsx";

const STORAGE_KEY = "test:docs-reader-context";

const readerContext: DocsReaderContextConfig = {
	storageKey: STORAGE_KEY,
	dimensions: [
		{
			name: "country",
			label: "Your company's country",
			shortLabel: "Company",
			queryParameter: "country",
			audiences: ["teams", "developers"],
			options: [
				{ value: "FR", label: "France", flag: "🇫🇷" },
				{ value: "LU", label: "Luxembourg", flag: "🇱🇺" },
			],
		},
		{
			name: "language",
			label: "Your working language",
			shortLabel: "Language",
			queryParameter: "language",
			audiences: ["developers"],
			options: [
				{ value: "en", label: "English" },
				{ value: "other", label: "Another language" },
			],
		},
	],
	applicability: {
		"/docs/developers/luxembourg": { country: ["LU"] },
	},
};

const proGroup = {
	label: "Developers",
	audience: "developers",
	items: [
		{ title: "Overview", href: "/docs/developers" },
		{ title: "Work in Luxembourg", href: "/docs/developers/luxembourg" },
	],
};
const tabs: Array<NavTab> = [
	{
		label: "Guides",
		href: "/docs",
		audiences: [
			{ id: "developers", label: "Developers", href: "/docs/developers" },
		],
		groups: [proGroup],
	},
];

function Providers({ children }: { children: ReactNode }) {
	return (
		<TestDocsProvider
			tabs={tabs}
			pathname="/docs/developers"
			location={{
				tab: tabs[0] ?? { label: "", href: "", audiences: [], groups: [] },
				group: proGroup,
				folders: [],
				item: proGroup.items[0] ?? { title: "", href: "" },
			}}
			readerContext={readerContext}
		>
			<DocsGuideProvider
				guide={{
					prerequisites: [],
					next: [],
					usedIn: [],
					sources: [],
					variants: [],
					audienceIndex: {
						audience: "developers",
						paths: [],
						planned: [
							{
								id: "payroll",
								title: "On payroll, working in English",
								description: "Your first projects while on payroll.",
								appliesTo: { country: ["FR"], language: ["en"] },
							},
							{
								id: "translated",
								title: "Working in another language",
								description: "Get your documents translated.",
								appliesTo: {
									country: ["FR"],
									language: ["other"],
								},
							},
						],
						topics: [],
					},
				}}
			>
				{children}
			</DocsGuideProvider>
		</TestDocsProvider>
	);
}

const variants = (
	<>
		<OnlyFor country="FR">
			<p>Register with the tax office.</p>
		</OnlyFor>
		<OnlyFor country="LU">
			<p>Ask for your social security number.</p>
		</OnlyFor>
	</>
);

function remember(context: Record<string, string>) {
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

function shownPassages(container: HTMLElement): Array<string | null> {
	return [...container.querySelectorAll("div:not([hidden]) > p + p")].map(
		(passage) => passage.textContent,
	);
}

beforeEach(() => {
	window.localStorage.clear();
	window.history.replaceState(null, "", "/docs/developers");
});

afterEach(cleanup);

describe("OnlyFor", () => {
	it("prerenders every variant, each labelled with the readers it is for", () => {
		remember({ country: "LU" });
		const html = renderToString(<Providers>{variants}</Providers>);

		expect(html).toContain("restriction(Company, France)");
		expect(html).toContain("Register with the tax office.");
		expect(html).toContain("restriction(Company, Luxembourg)");
		expect(html).toContain("Ask for your social security number.");
		expect(html).not.toContain("hidden");
	});

	it("shows only the variant of the reader's context once hydrated", () => {
		remember({ country: "LU" });
		const { container } = render(<Providers>{variants}</Providers>);

		expect(shownPassages(container)).toEqual([
			"Ask for your social security number.",
		]);
	});

	it("shows every variant to a reader who has not said", () => {
		remember({ language: "other" });
		const { container } = render(<Providers>{variants}</Providers>);

		expect(shownPassages(container)).toEqual([
			"Register with the tax office.",
			"Ask for your social security number.",
		]);
	});

	it("fails the render on a value the site does not declare", () => {
		spyOn(console, "error").mockImplementation(() => {});

		expect(() =>
			render(
				<Providers>
					<OnlyFor country="BE">x</OnlyFor>
				</Providers>,
			),
		).toThrow(
			"<OnlyFor> names no reader context, or a wrong one: country BE is not a value (one of FR, LU)",
		);
	});
});

describe("the reader context picker", () => {
	function selects(container: HTMLElement) {
		return [...container.querySelectorAll("select")];
	}

	it("asks a developer both questions and remembers the answers", () => {
		const { container } = render(
			<Providers>
				<AudienceIndex />
			</Providers>,
		);
		const [country, language] = selects(container);

		expect(
			[...container.querySelectorAll("label")].map((label) =>
				label.firstChild?.textContent?.trim(),
			),
		).toEqual(["Your company's country", "Your working language"]);
		expect(
			[...(country?.options ?? [])].map((option) => option.textContent),
		).toEqual(["unset", "🇫🇷\u2002France", "🇱🇺\u2002Luxembourg"]);
		act(() => {
			fireEvent.change(country ?? container, { target: { value: "FR" } });
			fireEvent.change(language ?? container, { target: { value: "other" } });
		});
		expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "")).toEqual({
			country: "FR",
			language: "other",
		});
	});

	it("asks the page's own question first, inside the same fieldset", () => {
		const { container } = render(
			<Providers>
				<ReaderContextPicker audience="developers">
					<label>
						Your trade
						<select />
					</label>
				</ReaderContextPicker>
			</Providers>,
		);

		expect(
			[...container.querySelectorAll("fieldset > label")].map((label) =>
				label.firstChild?.textContent?.trim(),
			),
		).toEqual([
			"Your trade",
			"Your company's country",
			"Your working language",
		]);
	});

	it("matches every passage until the reader answers, then theirs only", () => {
		function Probe() {
			const { matches } = useReaderContext();
			return (
				<p>
					{String(matches({ language: ["en"] }))}/
					{String(matches({ language: ["other"] }))}
				</p>
			);
		}
		const { container, rerender } = render(
			<Providers>
				<Probe />
			</Providers>,
		);

		expect(container.textContent).toBe("true/true");
		act(() => remember({ language: "other" }));
		rerender(
			<Providers>
				<Probe />
			</Providers>,
		);
		expect(container.textContent).toBe("false/true");
	});

	it("lists the planned paths of the reader's context only", () => {
		remember({ country: "FR", language: "other" });
		const { container } = render(
			<Providers>
				<AudienceIndex />
			</Providers>,
		);

		expect(container.textContent).toContain("Working in another language");
		expect(container.textContent).not.toContain(
			"On payroll, working in English",
		);
		expect(container.textContent).toContain("plannedLabel");
		expect(container.textContent).toContain(
			"restriction(Company, France) · restriction(Language, Another language)",
		);
	});

	it("keeps the answer for the page when storage is blocked", () => {
		const setItem = spyOn(Storage.prototype, "setItem").mockImplementation(
			() => {
				throw new Error("SecurityError");
			},
		);
		const getItem = spyOn(Storage.prototype, "getItem").mockImplementation(
			() => {
				throw new Error("SecurityError");
			},
		);
		const { container } = render(
			<Providers>
				<AudienceIndex />
			</Providers>,
		);
		act(() => {
			fireEvent.change(selects(container)[0] ?? container, {
				target: { value: "LU" },
			});
		});

		expect(selects(container)[0]?.value).toBe("LU");
		setItem.mockRestore();
		getItem.mockRestore();
	});
});

describe("the sidebar in a reader context", () => {
	it("dims a page written for another country, with the reason", () => {
		remember({ country: "FR" });
		const { getByText } = render(
			<Providers>
				<DocsSidebar />
			</Providers>,
		);
		const link = getByText("Work in Luxembourg").closest("a");

		expect(link?.className).toContain("opacity-50");
		expect(link?.textContent).toContain(
			"notForYou(restriction(Company, Luxembourg))",
		);
		expect(getByText("Overview").closest("a")?.className).not.toContain(
			"opacity-50",
		);
	});

	it("shows the chosen answers and opens the picker", () => {
		remember({ country: "FR", language: "en" });
		const { getByRole, container } = render(
			<Providers>
				<DocsSidebar />
			</Providers>,
		);
		const chip = getByRole("region", { name: "title" });

		expect(getByRole("img", { name: "France" }).textContent).toBe("🇫🇷");
		expect(chip.textContent).toContain("🇫🇷Company");
		expect(chip.textContent).toContain("Language English");
		act(() => {
			fireEvent.click(getByRole("button", { name: "change" }));
		});
		expect(container.querySelectorAll("select")).toHaveLength(2);
	});
});

describe("the reader context in the address", () => {
	it("adopts the context a link carries", () => {
		remember({ country: "FR", language: "en" });
		window.history.replaceState(null, "", "/docs/developers?country=LU&path=x");
		render(
			<Providers>
				<ReaderContextAddress />
			</Providers>,
		);

		expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "")).toEqual({
			country: "LU",
			language: "en",
		});
		expect(window.location.search).toBe("?country=LU&path=x");
	});

	it("never rewrites the address, which belongs to the router", () => {
		remember({ country: "FR" });
		window.history.replaceState(null, "", "/docs/developers#steps");
		render(
			<Providers>
				<ReaderContextAddress />
			</Providers>,
		);

		expect(`${window.location.search}${window.location.hash}`).toBe("#steps");
	});
});

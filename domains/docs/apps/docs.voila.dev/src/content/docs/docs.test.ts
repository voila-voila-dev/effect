import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { checkDocsGraph, type GraphPage } from "@voila.dev/docs/graph";
import { internalLinksIn } from "@voila.dev/docs/links";
import {
	navigationCoverage,
	navigationTopics,
} from "@voila.dev/docs/navigation";
import { Glob, YAML } from "bun";

import { docsConfig } from "../../../docs.config.ts";
import {
	DOCS_HOME_SLUG,
	frontmatterOf,
	pageHref,
} from "../../docs/vocabulary.ts";
import { docsNavigation } from "./navigation.ts";
import {
	linkedOutPackages,
	PACKAGES_ROOT,
	undocumentedPackages,
} from "./packages.ts";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/u;
const REPOSITORY = join(import.meta.dir, "../../../../../../..");

/** Every package directory: the repository tooling under `packages/`, the rest under `domains/<domain>/packages/`. */
const packageDirectories = [
	"packages/*/package.json",
	"domains/*/packages/*/package.json",
]
	.flatMap((pattern) => [...new Glob(pattern).scanSync(REPOSITORY)])
	.map((file) => dirname(file))
	.sort();

const mdxPages: Array<GraphPage> = [
	...new Glob("**/*.mdx").scanSync(import.meta.dir),
].map((file) => {
	const source = readFileSync(`${import.meta.dir}/${file}`, "utf8");
	const slug = file.replace(/\.mdx$/u, "");
	return {
		...frontmatterOf(
			YAML.parse(FRONTMATTER.exec(source)?.[1] ?? ""),
			`src/content/docs/${file}`,
		),
		slug,
		href: pageHref(slug),
		links: internalLinksIn(source.replace(FRONTMATTER, "")),
	};
});

/** The packages with a README page: every one but those ui.voila.dev documents and the undocumented ones. */
const documentedDirectories = packageDirectories.filter((directory) => {
	const name = basename(directory);
	return !(name in linkedOutPackages || undocumentedPackages.includes(name));
});
const documented = documentedDirectories.map((directory) =>
	basename(directory),
);

const readmePages: Array<GraphPage> = documented.map((name) => {
	const slug = `${PACKAGES_ROOT.slice(1)}/${name}`;
	return {
		...frontmatterOf(
			{
				title: `@voila.dev/${name}`,
				description: "A package README.",
				audience: ["everyone"],
				kind: "reference",
			},
			`${name}/README.md`,
		),
		slug,
		href: pageHref(slug),
		links: [],
	};
});

const pages = [...mdxPages, ...readmePages];

describe("the package pages", () => {
	it("finds the packages", () => {
		expect(documented).toContain("effect-ddd");
		expect(documented).toContain("biome-plugins");
	});

	it("serves each package at its own address", () => {
		const names = packageDirectories.map((directory) => basename(directory));
		expect(
			names.filter((name, index) => names.indexOf(name) !== index),
			"two packages share a folder name, so /packages/<name> is ambiguous",
		).toEqual([]);
	});

	it("leaves out only private packages", () => {
		const published = packageDirectories.filter(
			(directory) =>
				!JSON.parse(
					readFileSync(join(REPOSITORY, directory, "package.json"), "utf8"),
				).private,
		);
		expect(
			undocumentedPackages.filter((name) =>
				published.some((directory) => basename(directory) === name),
			),
			"a published package gets a page",
		).toEqual([]);
	});

	it("documents every package that is neither on ui.voila.dev nor undocumented, from its README", () => {
		expect(
			documentedDirectories.filter(
				(directory) => !existsSync(join(REPOSITORY, directory, "README.md")),
			),
			"write the package's README",
		).toEqual([]);
	});

	it("leaves out of the README glob exactly the packages it should", () => {
		const glob = readFileSync(
			join(import.meta.dir, "../../docs/readme-pages.ts"),
			"utf8",
		);
		const excluded = /!\*\*\/packages\/\{([^}]+)\}\/README\.md/u
			.exec(glob)?.[1]
			?.split(",")
			.sort();
		expect(excluded).toEqual(
			[...Object.keys(linkedOutPackages), ...undocumentedPackages].sort(),
		);
	});
});

describe("the docs", () => {
	const coverage = navigationCoverage(
		docsNavigation,
		pages.map((page) => page.slug),
	);

	it("lists every page in the sidebar exactly once", () => {
		expect(coverage.unlisted, "add the page to navigation.ts").toEqual([]);
		expect(coverage.repeated, "list the page once").toEqual([]);
	});

	it("lists only pages that exist", () => {
		expect(coverage.missing, "create the page or fix the slug").toEqual([]);
	});

	const report = checkDocsGraph({
		pages,
		paths: [],
		root: DOCS_HOME_SLUG,
		landings: docsConfig.vocabulary.landings,
		topics: navigationTopics(docsNavigation),
		today: new Date().toISOString().slice(0, 10),
	});

	it("links only to pages that exist", () => {
		expect(report.deadLinks, "fix the link or create the page").toEqual([]);
	});

	it("reaches every page within two clicks of the home", () => {
		expect(report.unreachable).toEqual([]);
	});

	it("links to every page from another one", () => {
		expect(report.orphans, "link the page from a related one").toEqual([]);
	});
});

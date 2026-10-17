import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
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
	isApiReferencePath,
	pageHref,
} from "../../docs/vocabulary.ts";
import { docsNavigation } from "./navigation.ts";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/u;

/** Every page as the graph reads it: its validated frontmatter and the site links of its body. */
const pages: Array<GraphPage> = [
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
		links: internalLinksIn(source.replace(FRONTMATTER, "")).filter(
			(href) => !isApiReferencePath(href),
		),
	};
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

	it("reaches every page within two clicks of its audience's landing", () => {
		expect(report.unreachable).toEqual([]);
	});

	it("links to every page from another one", () => {
		expect(report.orphans, "link the page from a related one").toEqual([]);
	});

	it("has re-read every page's sources in the last 180 days", () => {
		expect(report.stale, "re-read the sources, update lastVerified").toEqual(
			[],
		);
	});
});

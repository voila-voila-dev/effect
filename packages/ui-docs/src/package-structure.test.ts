import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
	type ContextPair,
	describeEdges,
	importEdges,
	staleEdges,
	undeclaredEdges,
} from "@voila.dev/effect-ddd/architecture";

// The dependency direction between folders, written down once. `lib/` is
// React-free helpers and the words type; `components/` holds the frame and
// the pieces every page shares; each subfolder of it (api, guide, mdx,
// search) builds on those, and the frame loads the guide and the search.

const ALLOWED: ReadonlyArray<ContextPair> = [
	["components", "components/guide"],
	["components", "components/search"],
	["components", "lib"],
	["components/api", "components"],
	["components/guide", "components"],
	["components/guide", "components/mdx"],
	["components/guide", "lib"],
	["components/mdx", "components"],
	["components/mdx", "lib"],
	["components/search", "components"],
	["components/search", "lib"],
];

const root = import.meta.dirname;
const files = readdirSync(root, { recursive: true, encoding: "utf8" })
	.map((file) => file.replaceAll("\\", "/"))
	.filter(
		(file) =>
			/\.tsx?$/u.test(file) && !/\.(test|test-helper)\.tsx?$/u.test(file),
	)
	.sort();
const contextOf = (path: string) => {
	const segments = path.split("/");
	return segments[0] === "components" && segments.length > 2
		? segments.slice(0, 2).join("/")
		: (segments[0] ?? path);
};
const edges = importEdges({ root, files, contextOf });

describe("package structure", () => {
	it("keeps every dependency between folders on the written list", () => {
		expect(
			describeEdges(undeclaredEdges(edges, ALLOWED)),
			"a new dependency between folders: add it to ALLOWED if it is deliberate, or invert it",
		).toStrictEqual([]);
	});

	it("keeps the list free of edges the code no longer has", () => {
		expect(staleEdges(edges, ALLOWED)).toStrictEqual([]);
	});

	// Everything here renders in the browser: the MDX compiler is the host's
	// build step, and nothing reads the file system or Bun.
	it("keeps the components free of the build side and of the server", () => {
		expect(
			files.flatMap((file) =>
				[...readFileSync(join(root, file), "utf8").matchAll(/from "([^"]+)"/gu)]
					.map(([, specifier]) => specifier ?? "")
					.filter((specifier) =>
						/^(@voila\.dev\/docs\/mdx\/|node:|bun$)/u.test(specifier),
					)
					.map((specifier) => `${file} -> ${specifier}`),
			),
		).toStrictEqual([]);
	});
});

import { describe, expect, test } from "bun:test";
import {
	copyFileSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const biome = Bun.resolveSync("@biomejs/biome/bin/biome", import.meta.dir);

interface Report {
	readonly diagnostics: ReadonlyArray<{
		readonly category: string;
		readonly location: { readonly start: { readonly line: number } };
	}>;
}

const fixturePath = (rule: string, fixture: string): string =>
	join(import.meta.dir, "fixtures", rule, fixture);

/**
 * The lines of `fixtures/<rule>/<fixture>` the rule reports, linted with that
 * rule alone.
 */
export const reportedLines = (
	rule: string,
	fixture: string,
): ReadonlyArray<number> => {
	// A scratch project of its own, so the repository's configuration (which
	// keeps the fixtures out of its own lint) does not apply.
	const project = mkdtempSync(join(tmpdir(), `${rule}-`));
	try {
		writeFileSync(
			join(project, "biome.json"),
			JSON.stringify({
				root: true,
				vcs: { enabled: false },
				linter: { enabled: true, rules: { preset: "none" } },
				plugins: [join(import.meta.dir, `${rule}.grit`)],
			}),
		);
		copyFileSync(fixturePath(rule, fixture), join(project, fixture));
		const run = Bun.spawnSync(
			[process.execPath, biome, "lint", "--reporter=json", fixture],
			{ cwd: project },
		);
		const report = JSON.parse(run.stdout.toString()) as Report;
		return report.diagnostics
			.filter((diagnostic) => diagnostic.category === "plugin")
			.map((diagnostic) => diagnostic.location.start.line);
	} finally {
		rmSync(project, { recursive: true, force: true });
	}
};

/** The lines of a fixture marked `// fires`, where a diagnostic is expected. */
export const markedLines = (
	rule: string,
	fixture: string,
): ReadonlyArray<number> =>
	readFileSync(fixturePath(rule, fixture), "utf8")
		.split("\n")
		.flatMap((line, index) => (line.endsWith("// fires") ? [index + 1] : []));

/**
 * `fixtures/<rule>/invalid.ts` must be reported on exactly its marked lines,
 * and `fixtures/<rule>/valid.ts` not at all.
 */
export const describeRule = (rule: string): void => {
	describe(rule, () => {
		test("reports every marked line of the invalid fixture, and only those", () => {
			const marked = markedLines(rule, "invalid.ts");
			expect(marked.length).toBeGreaterThan(0);
			expect(reportedLines(rule, "invalid.ts")).toEqual(marked);
		});

		test("stays silent on the valid fixture", () => {
			expect(reportedLines(rule, "valid.ts")).toEqual([]);
		});
	});
};

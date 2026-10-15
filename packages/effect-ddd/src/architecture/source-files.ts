import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_EXCLUDED = /\.(?:test|test-helper|d)\.ts$/u;

/**
 * Every `.ts` file under `root`, as `/`-separated paths relative to it, tests
 * and declaration files left out. `exclude` drops more (generated code).
 */
export function listSourceFiles(
	root: string,
	options: { readonly exclude?: (file: string) => boolean } = {},
): ReadonlyArray<string> {
	return readdirSync(root, { recursive: true, encoding: "utf8" })
		.map((file) => file.replaceAll("\\", "/"))
		.filter(
			(file) =>
				file.endsWith(".ts") &&
				!DEFAULT_EXCLUDED.test(file) &&
				!file.split("/").includes("node_modules") &&
				!(options.exclude?.(file) ?? false),
		)
		.sort();
}

export function readSource(root: string, file: string): string {
	return readFileSync(join(root, file), "utf8");
}

/**
 * The context a path belongs to: its first folder, unless that folder only
 * groups contexts (`platform/`), in which case the context is one level
 * deeper. Grouping folders may nest (`platform/integrations`).
 */
export function contextResolver(
	options: { readonly groupingDirectories?: ReadonlyArray<string> } = {},
): (path: string) => string {
	const grouping = new Set(options.groupingDirectories ?? []);
	return (path) => {
		const segments = path.split("/");
		let depth = 1;
		while (
			depth < segments.length - 1 &&
			grouping.has(segments.slice(0, depth).join("/"))
		) {
			depth += 1;
		}
		return segments.slice(0, depth).join("/");
	};
}

/**
 * The name a use case declared in `file` must carry: `<context>.<file name
 * without -use-case.ts>`, so `billing/use-cases/issue-invoice-use-case.ts`
 * declares `billing.issue-invoice`.
 */
export function useCaseNameOf(
	file: string,
	contextOf: (path: string) => string,
): string {
	const base = file.slice(file.lastIndexOf("/") + 1).replace(/\.ts$/u, "");
	return `${contextOf(file)}.${base.replace(/-use-case$/u, "")}`;
}

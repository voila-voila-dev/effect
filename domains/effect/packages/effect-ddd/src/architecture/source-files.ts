import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_EXCLUDED = /\.(?:test|test-helper|d)\.ts$/u;

function isSource(file: string): boolean {
	return (
		file.endsWith(".ts") &&
		!DEFAULT_EXCLUDED.test(file) &&
		!file.split("/").includes("node_modules")
	);
}

/**
 * Every `.ts` file under `root`, as sorted `/`-separated paths relative to it,
 * tests and declaration files left out. `exclude` drops more (generated code).
 */
export function listSourceFiles(
	root: string,
	options: { readonly exclude?: (file: string) => boolean } = {},
): ReadonlyArray<string> {
	return readdirSync(root, { recursive: true, encoding: "utf8" })
		.map((file) => file.replaceAll("\\", "/"))
		.filter((file) => isSource(file) && !(options.exclude?.(file) ?? false))
		.sort();
}

export function readSource(root: string, file: string): string {
	return readFileSync(join(root, file), "utf8");
}

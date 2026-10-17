import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** A throwaway source tree on disk, from `path → contents`. */
export function sourceTree(files: Readonly<Record<string, string>>) {
	const root = mkdtempSync(join(tmpdir(), "voila-ddd-"));
	for (const [file, contents] of Object.entries(files)) {
		mkdirSync(dirname(join(root, file)), { recursive: true });
		writeFileSync(join(root, file), contents);
	}
	return {
		root,
		remove: () => rmSync(root, { recursive: true, force: true }),
	};
}

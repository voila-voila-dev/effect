import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * The repository a script runs in: the nearest directory, from `from` up,
 * that holds a `.git` (a directory in a clone, a file in a worktree). Found
 * from the working directory rather than this file, which sits in
 * `node_modules` once the package is installed. Falls back to `from` outside
 * a repository.
 */
export function findRepositoryRoot(from: string = process.cwd()): string {
	let directory = resolve(from);
	while (!existsSync(join(directory, ".git"))) {
		const parent = dirname(directory);
		if (parent === directory) return resolve(from);
		directory = parent;
	}
	return directory;
}

/** A path relative to the repository root, whatever the script's depth in the tree. */
export function resolveFromRepositoryRoot(
	...segments: ReadonlyArray<string>
): string {
	return resolve(findRepositoryRoot(), ...segments);
}

import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findRepositoryRoot } from "./repository-root.ts";

const sandbox = () => realpathSync(mkdtempSync(join(tmpdir(), "script-kit-")));

describe("findRepositoryRoot", () => {
	it("walks up to the directory holding .git", () => {
		const root = sandbox();
		mkdirSync(join(root, ".git"));
		const nested = join(root, "scripts", "backfill", "src");
		mkdirSync(nested, { recursive: true });
		expect(findRepositoryRoot(nested)).toBe(root);
	});

	it("recognises a worktree, where .git is a file", () => {
		const root = sandbox();
		writeFileSync(join(root, ".git"), "gitdir: elsewhere");
		const nested = join(root, "packages", "a");
		mkdirSync(nested, { recursive: true });
		expect(findRepositoryRoot(nested)).toBe(root);
	});

	it("falls back to the starting directory outside a repository", () => {
		const outside = sandbox();
		expect(findRepositoryRoot(outside)).toBe(outside);
	});
});

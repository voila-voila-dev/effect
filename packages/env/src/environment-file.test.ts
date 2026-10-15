import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	loadEnvironmentFiles,
	mergeEnvironment,
	readEnvironmentFile,
} from "./environment-file.ts";

const directories: Array<string> = [];

function envFile(contents: string): string {
	const directory = mkdtempSync(join(tmpdir(), "voila-env-"));
	directories.push(directory);
	const path = join(directory, ".env");
	writeFileSync(path, contents);
	return path;
}

afterEach(() => {
	for (const directory of directories.splice(0)) {
		rmSync(directory, { recursive: true, force: true });
	}
});

describe("readEnvironmentFile", () => {
	it("tells a missing file from an empty one", () => {
		expect(readEnvironmentFile("/nonexistent/.env")).toBeNull();
		expect(readEnvironmentFile(envFile(""))).toStrictEqual({});
	});
});

describe("mergeEnvironment", () => {
	it("lets the environment win, then the earlier file", () => {
		const local = envFile("A=local\nB=local");
		const shared = envFile("A=shared\nB=shared\nC=shared");
		expect(
			mergeEnvironment([local, shared, "/nonexistent/.env"], {
				A: "env",
				UNSET: undefined,
			}),
		).toStrictEqual({ A: "env", B: "local", C: "shared" });
	});
});

describe("loadEnvironmentFiles", () => {
	it("fills process.env without overwriting it", () => {
		process.env.VOILA_ENV_TEST_SET = "exported";
		const path = envFile("VOILA_ENV_TEST_SET=file\nVOILA_ENV_TEST_NEW=file");
		try {
			loadEnvironmentFiles([path]);
			expect(process.env.VOILA_ENV_TEST_SET).toBe("exported");
			expect(process.env.VOILA_ENV_TEST_NEW).toBe("file");
		} finally {
			delete process.env.VOILA_ENV_TEST_SET;
			delete process.env.VOILA_ENV_TEST_NEW;
		}
	});
});

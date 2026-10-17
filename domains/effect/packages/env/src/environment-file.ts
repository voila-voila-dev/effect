import { existsSync, readFileSync } from "node:fs";
import { type Environment, parseEnvironment } from "./parse-environment.ts";

/**
 * The entries of one env file, or `null` when it does not exist, so a caller
 * can tell a missing file from an empty one.
 */
export function readEnvironmentFile(path: string): Environment | null {
	return existsSync(path) ? parseEnvironment(readFileSync(path, "utf8")) : null;
}

/**
 * The environment the files and `base` describe together. A key keeps the
 * first value it is given: `base` (the real environment) first, then each file
 * in order, so an exported CI or production value always wins over a file and
 * `.env.local` listed before `.env` overrides it.
 */
export function mergeEnvironment(
	paths: ReadonlyArray<string>,
	base: Readonly<Record<string, string | undefined>> = {},
): Environment {
	const merged: Record<string, string> = {};
	const sources = [
		base,
		...paths.map((path) => readEnvironmentFile(path) ?? {}),
	];
	for (const source of sources) {
		for (const [key, value] of Object.entries(source)) {
			if (value !== undefined && !(key in merged)) merged[key] = value;
		}
	}
	return merged;
}

/**
 * Load env files into `process.env` without overwriting what is already set —
 * for the tools that read `process.env` directly (a drizzle-kit config, a
 * script). Earlier files win over later ones.
 */
export function loadEnvironmentFiles(paths: ReadonlyArray<string>): void {
	const merged = mergeEnvironment(paths, process.env);
	for (const [key, value] of Object.entries(merged)) {
		process.env[key] ??= value;
	}
}

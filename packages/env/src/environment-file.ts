import { existsSync, readFileSync } from "node:fs";

export type Environment = Readonly<Record<string, string>>;

function unquote(value: string): string {
	const quote = value[0];
	if (
		(quote === '"' || quote === "'") &&
		value.endsWith(quote) &&
		value.length > 1
	) {
		const inner = value.slice(1, -1);
		// Only double quotes interpret escapes, as in a shell: a single-quoted
		// value is taken literally.
		return quote === '"'
			? inner.replaceAll("\\n", "\n").replaceAll('\\"', '"')
			: inner;
	}
	// An unquoted value ends at ` #`; a bare `#` stays, so a URL fragment or a
	// password holding one survives.
	const comment = value.search(/\s#/u);
	return (comment < 0 ? value : value.slice(0, comment)).trim();
}

/**
 * Parse the text of a `.env` file. Blank lines and `#` comments are skipped, an
 * `export ` prefix is accepted, and a line with no `=` is ignored rather than
 * fatal: a half-edited local file should not stop a dev server.
 */
export function parseEnvironment(text: string): Environment {
	const entries: Record<string, string> = {};
	for (const rawLine of text.split(/\r?\n/u)) {
		const line = rawLine.trim();
		if (line.length === 0 || line.startsWith("#")) continue;
		const separator = line.indexOf("=");
		if (separator < 0) continue;
		const key = line
			.slice(0, separator)
			.trim()
			.replace(/^export\s+/u, "");
		if (key.length === 0) continue;
		entries[key] = unquote(line.slice(separator + 1).trim());
	}
	return entries;
}

/**
 * The entries of one env file, or `null` when it does not exist, so a caller
 * can tell a missing file from an empty one.
 */
export function readEnvironmentFile(path: string): Environment | null {
	return existsSync(path) ? parseEnvironment(readFileSync(path, "utf8")) : null;
}

/**
 * The environment the files and `base` describe together. A key keeps the first
 * value it is given: `base` (the real environment) first, then each file in
 * order, so an exported CI or production value always wins over a file and
 * `.env.local` listed before `.env` overrides it.
 */
export function mergeEnvironment(
	paths: ReadonlyArray<string>,
	base: Readonly<Record<string, string | undefined>> = {},
): Environment {
	const merged: Record<string, string> = {};
	for (const [key, value] of Object.entries(base)) {
		if (value !== undefined) merged[key] = value;
	}
	for (const path of paths) {
		for (const [key, value] of Object.entries(
			readEnvironmentFile(path) ?? {},
		)) {
			if (!(key in merged)) merged[key] = value;
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
	for (const [key, value] of Object.entries(
		mergeEnvironment(paths, process.env),
	)) {
		if (process.env[key] === undefined) process.env[key] = value;
	}
}

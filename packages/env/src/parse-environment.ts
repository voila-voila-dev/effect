export type Environment = Readonly<Record<string, string>>;

function isQuoted(value: string, quote: string): boolean {
	return value.length > 1 && value.startsWith(quote) && value.endsWith(quote);
}

/**
 * A value as the shell would read it. Only double quotes interpret escapes: a
 * single-quoted value is literal. An unquoted value ends at ` #`; a bare `#`
 * stays, so a URL fragment or a password holding one survives.
 */
export function parseValue(raw: string): string {
	if (isQuoted(raw, '"')) {
		return raw.slice(1, -1).replaceAll("\\n", "\n").replaceAll('\\"', '"');
	}
	if (isQuoted(raw, "'")) {
		return raw.slice(1, -1);
	}
	const comment = raw.search(/\s#/u);
	return (comment < 0 ? raw : raw.slice(0, comment)).trim();
}

/** `[key, value]` for an assignment line, `null` for a blank line, a comment or garbage. */
export function parseLine(rawLine: string): readonly [string, string] | null {
	const line = rawLine.trim();
	if (line.length === 0 || line.startsWith("#")) return null;
	const separator = line.indexOf("=");
	if (separator < 0) return null;
	const key = line
		.slice(0, separator)
		.trim()
		.replace(/^export\s+/u, "");
	if (key.length === 0) return null;
	return [key, parseValue(line.slice(separator + 1).trim())];
}

/**
 * Parse the text of a `.env` file. Blank lines and `#` comments are skipped, an
 * `export ` prefix is accepted, and a line with no `=` is ignored rather than
 * fatal: a half-edited local file should not stop a dev server.
 */
export function parseEnvironment(text: string): Environment {
	const entries: Record<string, string> = {};
	for (const line of text.split(/\r?\n/u)) {
		const entry = parseLine(line);
		if (entry !== null) entries[entry[0]] = entry[1];
	}
	return entries;
}

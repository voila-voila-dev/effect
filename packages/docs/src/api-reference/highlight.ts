export type TokenKind =
	| "key"
	| "string"
	| "number"
	| "literal"
	| "keyword"
	| "function"
	| "punctuation"
	| "command"
	| "flag"
	| "plain";

export interface Token {
	kind: TokenKind;
	/** Where the token starts in the code: its stable key when rendered. */
	readonly offset: number;
	text: string;
}

export type ExampleLanguage = "json" | "shell" | "javascript";

interface Rule {
	kind: TokenKind;
	pattern: RegExp;
}

// The examples are generated, so a handful of rules colors them fully; Shiki
// would ship its grammar to the client for the same result.
const RULES: Readonly<Record<ExampleLanguage, ReadonlyArray<Rule>>> = {
	json: [
		{ kind: "key", pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/uy },
		{ kind: "string", pattern: /"(?:[^"\\]|\\.)*"/uy },
		{ kind: "number", pattern: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/uy },
		{ kind: "literal", pattern: /\b(?:true|false|null)\b/uy },
		{ kind: "punctuation", pattern: /[{}[\],:]/uy },
	],
	javascript: [
		{ kind: "key", pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/uy },
		{ kind: "string", pattern: /"(?:[^"\\]|\\.)*"/uy },
		{ kind: "keyword", pattern: /\b(?:const|await)\b/uy },
		{ kind: "literal", pattern: /\b(?:true|false|null)\b/uy },
		{ kind: "function", pattern: /[A-Za-z_$][\w$]*(?=\()/uy },
		{ kind: "key", pattern: /[A-Za-z_$][\w$]*(?=:)/uy },
		{ kind: "plain", pattern: /[A-Za-z_$][\w$]*/uy },
		{ kind: "number", pattern: /-?\d+(?:\.\d+)?/uy },
		{ kind: "punctuation", pattern: /[{}[\](),:;.=]/uy },
	],
	shell: [
		{ kind: "command", pattern: /^curl\b/muy },
		{ kind: "flag", pattern: /--?[a-zA-Z][\w-]*/uy },
		{ kind: "string", pattern: /'[^']*'/uy },
	],
};

/** The first rule that reads a non-empty token at `position`, or one plain character. */
function tokenAt(
	rules: ReadonlyArray<Rule>,
	code: string,
	position: number,
): Token {
	for (const rule of rules) {
		rule.pattern.lastIndex = position;
		const found = rule.pattern.exec(code);
		if (found !== null && found[0] !== "") {
			return { kind: rule.kind, text: found[0], offset: position };
		}
	}
	return { kind: "plain", text: code[position] ?? "", offset: position };
}

export function tokenize(
	code: string,
	language: ExampleLanguage,
): Array<Token> {
	const rules = RULES[language];
	const tokens: Array<Token> = [];
	let position = 0;
	while (position < code.length) {
		const token = tokenAt(rules, code, position);
		const last = tokens.at(-1);
		if (token.kind === "plain" && last?.kind === "plain") {
			last.text += token.text;
		} else {
			tokens.push(token);
		}
		position += token.text.length;
	}
	return tokens;
}

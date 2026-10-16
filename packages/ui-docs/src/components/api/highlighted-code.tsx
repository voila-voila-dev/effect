import {
	type ExampleLanguage,
	type TokenKind,
	tokenize,
} from "@voila.dev/docs/api-reference/highlight";
import { CodePre } from "../code-panel.tsx";

// The GitHub light and dark palettes, as Shiki colors the fenced blocks.
const TOKEN_COLORS: Readonly<Record<TokenKind, string>> = {
	key: "text-[#005cc5] dark:text-[#79b8ff]",
	string: "text-[#032f62] dark:text-[#9ecbff]",
	number: "text-[#005cc5] dark:text-[#79b8ff]",
	literal: "text-[#005cc5] dark:text-[#79b8ff]",
	keyword: "text-[#d73a49] dark:text-[#f97583]",
	function: "text-[#6f42c1] dark:text-[#b392f0]",
	punctuation: "text-[#24292e] dark:text-[#e1e4e8]",
	command: "text-[#6f42c1] dark:text-[#b392f0]",
	flag: "text-[#005cc5] dark:text-[#79b8ff]",
	plain: "text-[#24292e] dark:text-[#e1e4e8]",
};

/** A generated example, colored like the fenced blocks without shipping Shiki. */
export function HighlightedCode({
	code,
	language,
}: {
	code: string;
	language: ExampleLanguage;
}) {
	return (
		<CodePre>
			<code>
				{tokenize(code, language).map((token) => (
					<span key={token.offset} className={TOKEN_COLORS[token.kind]}>
						{token.text}
					</span>
				))}
			</code>
		</CodePre>
	);
}

import type { ComponentProps } from "react";

import { CodePanel, CodePre } from "../code-panel.tsx";
import { useDocs } from "../docs-provider.tsx";

const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
	bash: "Terminal",
	sh: "Terminal",
	shell: "Terminal",
	json: "JSON",
	ts: "TypeScript",
	tsx: "TypeScript",
	typescript: "TypeScript",
	js: "JavaScript",
	javascript: "JavaScript",
	http: "HTTP",
	markdown: "Markdown",
	md: "Markdown",
};

export interface CodeBlockProps extends ComponentProps<"pre"> {
	"data-title"?: string;
	"data-language"?: string;
}

/** A fence's tab label: its `title="…"`, else its language; `plainText` names a fence without one. */
export function codeBlockLabel(
	props: CodeBlockProps,
	plainText: string,
): string {
	const language = props["data-language"] ?? "text";
	const labels: Readonly<Record<string, string>> = {
		...LANGUAGE_LABELS,
		text: plainText,
	};
	return props["data-title"] ?? labels[language] ?? language;
}

/** A fenced code block, already highlighted by Shiki at build time. */
export function CodeBlock(props: CodeBlockProps) {
	const { messages } = useDocs();
	return (
		<CodePanel
			tabs={[
				{
					label: codeBlockLabel(props, messages.plainText),
					content: <CodePre {...props} />,
				},
			]}
		/>
	);
}

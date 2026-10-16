import {
	CaretDownIcon,
	ChatTeardropTextIcon,
	CopyIcon,
	MarkdownLogoIcon,
	OpenAiLogoIcon,
} from "@phosphor-icons/react";
import { useCopy } from "../lib/use-copy.ts";
import { CopyButton } from "./copy-button.tsx";
import { DocsMenu } from "./docs-menu.tsx";
import { useDocs } from "./docs-provider.tsx";

/** Opens the tab inside the click, before the source loads: a popup opened later is blocked. */
async function viewAsText(source: () => Promise<string>) {
	const view = window.open("", "_blank");
	const text = await source();
	const url = URL.createObjectURL(
		new Blob([text], { type: "text/plain;charset=utf-8" }),
	);
	if (view) {
		view.location.href = url;
	}
}

/** Resend's split button: copy the page as Markdown, or hand it to a reader or an assistant. */
export function PageActions({
	source,
	url,
}: {
	/** The page as Markdown. */
	source: () => Promise<string>;
	/** The page's absolute URL, which the assistants are asked to read. */
	url: string;
}) {
	const { copy } = useCopy();
	const { messages } = useDocs();
	const prompt = encodeURIComponent(messages.aiPrompt(url));
	return (
		<div className="inline-flex h-[2.125rem] shrink-0 rounded-xl border border-border">
			<CopyButton
				text={source}
				label={messages.copyPage}
				copiedLabel={messages.copyPageDone}
				className="w-10 justify-center rounded-l-[0.6875rem] hover:bg-foreground/5"
			/>
			<DocsMenu
				label={messages.pageActionsAria}
				triggerClassName="w-9 rounded-r-[0.6875rem] border-l border-border"
				trigger={<CaretDownIcon className="size-3.5" aria-hidden />}
				items={[
					{
						icon: CopyIcon,
						title: messages.copyPage,
						description: messages.copyPageHint,
						onClick: () => copy(source()),
					},
					{
						icon: MarkdownLogoIcon,
						title: messages.viewMarkdown,
						description: messages.viewMarkdownHint,
						onClick: () => viewAsText(source),
					},
					{
						icon: OpenAiLogoIcon,
						title: messages.openChatgpt,
						description: messages.askAboutPage,
						href: `https://chatgpt.com/?hints=search&q=${prompt}`,
					},
					{
						icon: ChatTeardropTextIcon,
						title: messages.openClaude,
						description: messages.askAboutPage,
						href: `https://claude.ai/new?q=${prompt}`,
					},
				]}
			/>
		</div>
	);
}

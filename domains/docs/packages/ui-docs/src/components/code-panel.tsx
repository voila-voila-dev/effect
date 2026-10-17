import { Tabs } from "@base-ui/react/tabs";
import { type ReactNode, useRef } from "react";
import { cn } from "../lib/cn.ts";

import { CopyButton } from "./copy-button.tsx";
import { useDocs } from "./docs-provider.tsx";

export interface CodePanelTab {
	label: ReactNode;
	/** A `<pre>`: the panel copies its text. */
	content: ReactNode;
}

/**
 * Every piece of code in the docs: a fenced block, a CodeGroup, an API request
 * or response. A grey shell holds a header (one tab per variant, and the copy
 * button) over the code on a white inner panel. Every tab stays mounted so the
 * prerendered page holds every variant's text.
 */
export function CodePanel({
	tabs,
	className,
}: {
	tabs: ReadonlyArray<CodePanelTab>;
	className?: string;
}) {
	const panels = useRef<HTMLDivElement>(null);
	const { messages } = useDocs();
	return (
		<Tabs.Root
			defaultValue={0}
			className={cn(
				"rounded-2xl border border-border bg-docs-canvas p-1",
				className,
			)}
		>
			<div className="flex h-9 items-center justify-between gap-3 pr-1.5 pl-3">
				<Tabs.List className="relative flex h-full min-w-0 gap-4 overflow-x-auto [scrollbar-width:none]">
					{tabs.map((tab, index) => (
						<Tabs.Tab
							// biome-ignore lint/suspicious/noArrayIndexKey: rendered from content that never reorders: the position is the identity
							key={index}
							value={index}
							className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium text-muted-foreground text-xs outline-none transition-colors hover:text-foreground focus-visible:text-foreground data-[active]:text-foreground"
						>
							{tab.label}
						</Tabs.Tab>
					))}
					<Tabs.Indicator className="absolute bottom-0 left-[var(--active-tab-left)] h-0.5 w-[var(--active-tab-width)] rounded-full bg-foreground transition-all duration-200" />
				</Tabs.List>
				<CopyButton
					text={() =>
						panels.current?.querySelector("[data-code-panel]:not([hidden])")
							?.textContent ?? ""
					}
					label={messages.copyCode}
					copiedLabel={messages.copyCodeDone}
					className="size-7 justify-center rounded-lg hover:bg-foreground/5"
				/>
			</div>
			<div
				ref={panels}
				className="overflow-hidden rounded-xl border border-border bg-background"
			>
				{tabs.map((tab, index) => (
					<Tabs.Panel
						// biome-ignore lint/suspicious/noArrayIndexKey: rendered from content that never reorders: the position is the identity
						key={index}
						value={index}
						keepMounted
						data-code-panel=""
						className="outline-none"
					>
						{tab.content}
					</Tabs.Panel>
				))}
			</div>
		</Tabs.Root>
	);
}

/** The `<pre>` inside a CodePanel. */
export function CodePre({ className, ...props }: React.ComponentProps<"pre">) {
	return (
		<pre
			{...props}
			className={cn(
				"max-h-[32rem] overflow-auto px-4 py-3.5 font-mono text-[0.8125rem] leading-6 [scrollbar-width:thin]",
				className,
			)}
		/>
	);
}

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
	Children,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";

import { CodePanel, CodePre } from "../code-panel.tsx";
import { useDocs } from "../docs-provider.tsx";
import { type CodeBlockProps, codeBlockLabel } from "./code-block.tsx";

/** MDX wraps a block separated by blank lines in a fragment; the tabs are what is inside. */
function elementsOf<Props>(children: ReactNode): Array<ReactElement<Props>> {
	return Children.toArray(children).flatMap((child) => {
		if (!isValidElement<Props & { children?: ReactNode }>(child)) {
			return [];
		}
		return child.type === Fragment
			? elementsOf<Props>(child.props.children)
			: [child];
	});
}

/** Panels stay mounted so the prerendered page holds every tab's text. */
export function Tabs({ children }: { children: ReactNode }) {
	const tabs = elementsOf<{ title: string; children: ReactNode }>(children);
	return (
		<BaseTabs.Root defaultValue={0}>
			<BaseTabs.List className="relative flex gap-6 overflow-x-auto border-border border-b">
				{tabs.map((tab, index) => (
					<BaseTabs.Tab
						key={tab.props.title}
						value={index}
						className="h-10 shrink-0 font-medium text-docs-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground data-[active]:text-foreground"
					>
						{tab.props.title}
					</BaseTabs.Tab>
				))}
				<BaseTabs.Indicator className="absolute bottom-[-1px] left-[var(--active-tab-left)] h-0.5 w-[var(--active-tab-width)] rounded-full bg-foreground transition-all duration-200" />
			</BaseTabs.List>
			{tabs.map((tab, index) => (
				<BaseTabs.Panel
					key={tab.props.title}
					value={index}
					keepMounted
					className="docs-flow pt-5 outline-none"
				>
					{tab.props.children}
				</BaseTabs.Panel>
			))}
		</BaseTabs.Root>
	);
}

export function Tab({ children }: { title: string; children: ReactNode }) {
	return <>{children}</>;
}

/** Tabbed code blocks: one fence per variant, labeled by its `title="…"` or language. */
export function CodeGroup({ children }: { children: ReactNode }) {
	const { messages } = useDocs();
	return (
		<CodePanel
			tabs={elementsOf<CodeBlockProps>(children).map((block) => ({
				label: codeBlockLabel(block.props, messages.plainText),
				content: <CodePre {...block.props} />,
			}))}
		/>
	);
}

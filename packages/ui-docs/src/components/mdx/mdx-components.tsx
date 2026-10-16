import type { ComponentProps } from "react";

import { DocsLink } from "../docs-link.tsx";
import { Accordion, AccordionGroup } from "./accordion.tsx";
import { AudienceIndex } from "./audience-index.tsx";
import { Callout, Danger, Note, Tip, Warning } from "./callout.tsx";
import { Card, CardGroup } from "./card.tsx";
import { CodeBlock } from "./code-block.tsx";
import { CodeValue } from "./code-value.tsx";
import { H2, H3 } from "./heading.tsx";
import { useInsideLink } from "./inside-link.tsx";
import { OnlyFor } from "./only-for.tsx";
import { PathSteps } from "./path-steps.tsx";
import { Screenshot } from "./screenshot.tsx";
import { Step, Steps } from "./steps.tsx";
import { CodeGroup, Tab, Tabs } from "./tabs.tsx";

function Anchor({ href = "", ...props }: ComponentProps<"a">) {
	const insideLink = useInsideLink();
	return insideLink ? (
		<span>{props.children}</span>
	) : (
		<DocsLink href={href} {...props} />
	);
}

function Table(props: ComponentProps<"table">) {
	return (
		<div className="overflow-x-auto rounded-2xl border border-border">
			<table {...props} />
		</div>
	);
}

/** Every docs page can use these without importing them. */
export const mdxComponents = {
	a: Anchor,
	h2: H2,
	h3: H3,
	pre: CodeBlock,
	table: Table,
	Accordion,
	AccordionGroup,
	AudienceIndex,
	Callout,
	Card,
	CardGroup,
	CodeGroup,
	CodeValue,
	Danger,
	Note,
	OnlyFor,
	PathSteps,
	Screenshot,
	Step,
	Steps,
	Tab,
	Tabs,
	Tip,
	Warning,
};

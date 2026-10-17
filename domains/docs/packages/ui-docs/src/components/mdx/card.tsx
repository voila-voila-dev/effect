import type { ReactNode } from "react";
import { cn } from "../../lib/cn.ts";

import type { DocsPageLink } from "../docs-guide.tsx";
import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";
import { InsideLink } from "./inside-link.tsx";

interface CardProps {
	title: string;
	/** One of the glyphs the provider maps. */
	icon?: string;
	href?: string;
	children?: ReactNode;
}

function CardBody({ title, icon, children }: CardProps) {
	const { icons } = useDocs();
	const Icon = icon ? icons[icon] : undefined;
	return (
		<>
			{Icon ? (
				<Icon className="mb-4 size-6 text-foreground" aria-hidden />
			) : null}
			<span className="block font-semibold text-foreground">{title}</span>
			{children ? (
				<span className="mt-1 block text-muted-foreground [&_p]:m-0">
					{children}
				</span>
			) : null}
		</>
	);
}

const CARD_FRAME =
	"block rounded-2xl border border-border bg-background px-6 py-5 leading-7 no-underline";

export function Card(props: CardProps) {
	if (!props.href) {
		return (
			<div className={CARD_FRAME}>
				<CardBody {...props} />
			</div>
		);
	}
	return (
		<DocsLink
			href={props.href}
			className={cn(
				CARD_FRAME,
				"font-normal transition-colors hover:border-foreground/25",
			)}
		>
			<InsideLink value={true}>
				<CardBody {...props} />
			</InsideLink>
		</DocsLink>
	);
}

/** A card for another docs page: its icon, title and description. */
export function PageCard({ page }: { page: DocsPageLink }) {
	return (
		<Card
			title={page.title}
			href={page.href}
			{...(page.icon ? { icon: page.icon } : {})}
		>
			{page.description}
		</Card>
	);
}

const COLUMNS: Readonly<Record<1 | 2 | 3, string>> = {
	1: "sm:grid-cols-1",
	2: "sm:grid-cols-2",
	3: "sm:grid-cols-2 lg:grid-cols-3",
};

export function CardGroup({
	cols = 2,
	children,
}: {
	cols?: 1 | 2 | 3;
	children: ReactNode;
}) {
	return <div className={cn("grid gap-4", COLUMNS[cols])}>{children}</div>;
}

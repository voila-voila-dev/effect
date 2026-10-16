import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { NavItem } from "@voila.dev/docs/navigation";
import { cn } from "../lib/cn.ts";

import { DocsLink } from "./docs-link.tsx";
import { useDocs } from "./docs-provider.tsx";
import { StillStuck } from "./guide/still-stuck.tsx";

const DIRECTIONS = {
	previous: { Arrow: ArrowLeftIcon, rel: "prev", label: "previous" },
	next: { Arrow: ArrowRightIcon, rel: "next", label: "next" },
} as const;

function PagerCard({
	item,
	direction,
}: {
	item: NavItem;
	direction: keyof typeof DIRECTIONS;
}) {
	const { messages } = useDocs();
	const { Arrow, rel, label } = DIRECTIONS[direction];
	const next = direction === "next";
	return (
		<DocsLink
			href={item.href}
			rel={rel}
			className={cn(
				"group flex min-w-0 flex-col gap-1 rounded-2xl border border-border px-5 py-4 transition-colors hover:border-foreground/25",
				next && "items-end text-right sm:col-start-2",
			)}
		>
			<span className="flex items-center gap-1.5 text-docs-sm text-muted-foreground">
				{next ? null : <Arrow className="size-3.5" aria-hidden />}
				{messages[label]}
				{next ? <Arrow className="size-3.5" aria-hidden /> : null}
			</span>
			<span className="font-medium text-foreground">{item.title}</span>
		</DocsLink>
	);
}

/** The end of every docs page: its neighbours (in the sidebar, or in the reader's path when given), the support contact, then the host's footer. */
export function DocsFooter({
	neighbours,
}: {
	neighbours?: { previous?: NavItem | undefined; next?: NavItem | undefined };
}) {
	const { navigation, messages, footer } = useDocs();
	const { previous, next } = neighbours ?? navigation.location ?? {};
	return (
		<footer className="mt-16 pb-6">
			{previous || next ? (
				<nav
					aria-label={messages.pagerAria}
					className="grid gap-4 sm:grid-cols-2"
				>
					{previous ? <PagerCard item={previous} direction="previous" /> : null}
					{next ? <PagerCard item={next} direction="next" /> : null}
				</nav>
			) : null}
			<StillStuck />
			<div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-border border-t pt-6 text-docs-sm text-muted-foreground">
				{footer}
			</div>
		</footer>
	);
}

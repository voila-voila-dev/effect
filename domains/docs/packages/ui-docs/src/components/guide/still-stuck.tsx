import { LifebuoyIcon } from "@phosphor-icons/react";

import { DocsLink } from "../docs-link.tsx";
import { useDocs } from "../docs-provider.tsx";

/** "Still stuck?": the support contact the site already gives, at the end of every page. */
export function StillStuck() {
	const { messages, support } = useDocs();
	return (
		<aside className="mt-12 flex flex-col gap-4 rounded-2xl bg-foreground/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex gap-3">
				<LifebuoyIcon
					className="mt-1 size-5 shrink-0 text-foreground/60"
					aria-hidden
				/>
				<div>
					<p className="font-semibold text-foreground">
						{messages.guide.stillStuckTitle}
					</p>
					<p className="text-docs-sm text-muted-foreground">
						{messages.guide.stillStuckBody}
					</p>
				</div>
			</div>
			<DocsLink
				href={support.href}
				className="shrink-0 rounded-xl border border-border bg-background px-3.5 py-2 font-medium text-docs-sm text-foreground transition-colors hover:border-foreground/25"
			>
				{support.label}
			</DocsLink>
		</aside>
	);
}

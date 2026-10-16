import { CaretRightIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useDocs } from "./docs-provider.tsx";

/**
 * A docs page's title block: where it sits in the sidebar, its one h1, its
 * lead, and its actions beside the title (under the lead on a phone).
 */
export function DocsPageHeader({
	meta,
	trail,
	title,
	description,
	actions,
	children,
}: {
	/** What the host tells crawlers about the page, like its breadcrumb's structured data. */
	meta?: ReactNode;
	/** The sidebar group (and folders) above the page. */
	trail: ReadonlyArray<string>;
	title: string;
	description?: string | undefined;
	actions?: ReactNode;
	/** What the title block ends with, like an API endpoint. */
	children?: ReactNode;
}) {
	const { messages } = useDocs();
	return (
		<header className="mb-10">
			{meta}
			{trail.length > 0 ? (
				<nav aria-label={messages.breadcrumbAria}>
					<ol className="flex flex-wrap items-center gap-1.5 text-docs-sm text-muted-foreground">
						{trail.map((label, index) => (
							<li key={label} className="flex items-center gap-1.5">
								{index > 0 ? (
									<CaretRightIcon className="size-3" aria-hidden />
								) : null}
								{label}
							</li>
						))}
					</ol>
				</nav>
			) : null}
			<div className="mt-2.5 flex items-start justify-between gap-6">
				<h1 className="font-heading font-semibold text-[2.25rem] text-foreground leading-10 tracking-[-0.025em]">
					{title}
				</h1>
				{actions ? (
					<div className="mt-0.5 hidden sm:block">{actions}</div>
				) : null}
			</div>
			{description ? (
				<p className="mt-2 text-[1.3125rem] text-foreground/75 leading-8">
					{description}
				</p>
			) : null}
			{actions ? <div className="mt-4 sm:hidden">{actions}</div> : null}
			{children}
		</header>
	);
}

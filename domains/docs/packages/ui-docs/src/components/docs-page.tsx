import type { ReactNode } from "react";
import { cn } from "../lib/cn.ts";

const COLUMNS = {
	toc: { article: "basis-docs-guide", aside: "w-docs-toc shrink-0" },
	examples: { article: "basis-docs-api", aside: "min-w-0 basis-docs-examples" },
} as const;

/** The panel's content: the article column, and beside it the outline or the API examples from xl up. */
export function DocsPage({
	aside,
	columns = "toc",
	children,
}: {
	aside?: ReactNode;
	columns?: keyof typeof COLUMNS;
	children: ReactNode;
}) {
	return (
		<div className="flex justify-center gap-12 px-4 pt-8 sm:px-8 lg:px-12 lg:pt-12 2xl:px-16">
			<article
				className={cn("min-w-0 text-docs-base", COLUMNS[columns].article)}
			>
				{children}
			</article>
			{/* Rendered even when empty, so every page's column starts at the same x. */}
			<aside className={cn("hidden xl:block", COLUMNS[columns].aside)}>
				<div className="sticky top-[calc(var(--docs-top)+3rem)] max-h-[calc(100dvh-var(--docs-top)-4.5rem)] overflow-y-auto">
					{aside}
				</div>
			</aside>
		</div>
	);
}

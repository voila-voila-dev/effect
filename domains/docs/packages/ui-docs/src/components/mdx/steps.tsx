import type { ReactNode } from "react";

/** A numbered step with the line that joins it to the next one. */
export const STEP_ITEM =
	"relative m-0 pb-8 pl-11 [counter-increment:docs-step] last:pb-0 before:absolute before:top-0 before:left-0 before:flex before:size-7 before:items-center before:justify-center before:rounded-full before:bg-foreground/[0.06] before:text-xs before:font-semibold before:text-foreground before:content-[counter(docs-step)] after:absolute after:top-9 after:bottom-1 after:left-3.5 after:w-px after:bg-border last:after:hidden";

export const STEP_LIST = "list-none p-0 [counter-reset:docs-step]";

export function Steps({ children }: { children: ReactNode }) {
	return <ol className={STEP_LIST}>{children}</ol>;
}

export function Step({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<li className={STEP_ITEM}>
			<p className="text-foreground text-lg leading-7">{title}</p>
			<div className="docs-flow mt-3">{children}</div>
		</li>
	);
}

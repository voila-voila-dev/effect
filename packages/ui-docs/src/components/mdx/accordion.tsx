import { CaretRightIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

/** A native disclosure: no script, and the browser's find-in-page opens it. */
export function Accordion({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<details className="group/accordion border-border border-b last:border-b-0">
			<summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 font-medium text-foreground transition-colors hover:bg-foreground/[0.03] [&::-webkit-details-marker]:hidden">
				<CaretRightIcon
					className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open/accordion:rotate-90"
					weight="bold"
					aria-hidden
				/>
				{title}
			</summary>
			<div className="docs-flow px-5 pb-5 pl-[2.875rem]">{children}</div>
		</details>
	);
}

export function AccordionGroup({ children }: { children: ReactNode }) {
	return (
		<div className="overflow-hidden rounded-2xl border border-border">
			{children}
		</div>
	);
}

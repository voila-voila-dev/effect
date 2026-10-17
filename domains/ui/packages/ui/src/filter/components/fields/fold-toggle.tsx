import type * as React from "react";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"button"> {
	expanded: boolean;
	/** How many options the fold hides, for the "N more…" copy. */
	foldedCount: number;
	onToggle: () => void;
}

/** The link that unfolds a select's secondary options, or folds them back. */
export function FoldToggle({
	expanded,
	foldedCount,
	onToggle,
	className,
	...props
}: Props) {
	const labels = useFilterLabels();
	return (
		<button
			type="button"
			data-slot="filter-fold-toggle"
			aria-expanded={expanded}
			onClick={onToggle}
			className={cn(
				"cursor-pointer self-start text-muted-foreground text-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
				className,
			)}
			{...props}
		>
			{expanded ? labels.lessOptions : labels.moreOptions(foldedCount)}
		</button>
	);
}

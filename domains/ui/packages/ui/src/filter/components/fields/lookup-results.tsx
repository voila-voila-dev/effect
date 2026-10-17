import { SpinnerGapIcon } from "@phosphor-icons/react";
import type * as React from "react";
import { LOOKUP_MIN_QUERY_LENGTH } from "#/filter/hooks/use-debounced-lookup.ts";
import { useFilterLabels } from "#/filter/hooks/use-filter-labels.ts";
import { cn } from "#/lib/utils.ts";

// `results` is omitted from the base: React declares it on every element as
// Safari's legacy `<input results>` number.
interface Props<Result extends { id: string; label: string }>
	extends Omit<React.ComponentProps<"ul">, "results"> {
	results: ReadonlyArray<Result>;
	busy: boolean;
	query: string;
	/** Shown once a long-enough query found nothing. */
	noResults: string;
	/** Leading glyph of each row (a pin for places, a person for records). */
	icon: React.ReactNode;
	onPick: (result: Result) => void;
}

/**
 * The suggestion list under a search-as-you-type field: a spinner while the
 * lookup runs, the empty copy once a real query found nothing, and one
 * pickable row per result otherwise.
 */
export function LookupResults<Result extends { id: string; label: string }>({
	results,
	busy,
	query,
	noResults,
	icon,
	onPick,
	className,
	...props
}: Props<Result>) {
	const labels = useFilterLabels();
	if (busy) {
		return (
			<p
				data-slot="filter-lookup-results"
				className="flex items-center gap-2 text-muted-foreground text-sm"
			>
				<SpinnerGapIcon className="size-4 animate-spin" />
				{labels.search}
			</p>
		);
	}
	if (query.trim().length >= LOOKUP_MIN_QUERY_LENGTH && results.length === 0) {
		return (
			<p
				data-slot="filter-lookup-results"
				className="text-muted-foreground text-sm"
			>
				{noResults}
			</p>
		);
	}
	return (
		<ul
			data-slot="filter-lookup-results"
			className={cn("flex flex-col gap-1", className)}
			{...props}
		>
			{results.map((result) => (
				<li key={result.id}>
					<button
						type="button"
						onClick={() => onPick(result)}
						className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground"
					>
						{icon}
						<span className="truncate">{result.label}</span>
					</button>
				</li>
			))}
		</ul>
	);
}

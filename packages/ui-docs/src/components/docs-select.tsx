import { CaretUpDownIcon } from "@phosphor-icons/react";
import { cn } from "../lib/cn.ts";

import type { DocsReaderOption } from "./docs-provider.tsx";

function optionText({ flag, label }: DocsReaderOption): string {
	return flag ? `${flag} ${label}` : label;
}

/**
 * A labelled native select in the docs' look. Native on purpose: the phone's
 * own wheel, the keyboard and screen readers come free, and no popup code
 * ships on every page.
 */
export function DocsSelect({
	id,
	label,
	value,
	options,
	unsetLabel,
	onChange,
	compact = false,
	className,
}: {
	id: string;
	label: string;
	value: string;
	options: ReadonlyArray<DocsReaderOption>;
	/** The empty answer's label: "Not specified". */
	unsetLabel: string;
	onChange: (value: string | undefined) => void;
	compact?: boolean;
	className?: string;
}) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"grid font-medium",
				compact
					? "gap-1 text-muted-foreground text-xs"
					: "gap-1.5 text-docs-sm text-foreground",
				className,
			)}
		>
			{label}
			<span className="relative block">
				<select
					id={id}
					value={value}
					onChange={(event) => onChange(event.target.value || undefined)}
					className={cn(
						"docs-control w-full cursor-pointer appearance-none truncate rounded-lg border border-border bg-background pr-8 pl-3 font-normal text-foreground shadow-xs transition-[border-color,box-shadow] hover:border-foreground/25 focus-visible:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/25",
						compact ? "h-8 text-[0.8125rem]" : "h-9 text-docs-sm",
					)}
				>
					<option value="">{unsetLabel}</option>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{optionText(option)}
						</option>
					))}
				</select>
				<CaretUpDownIcon
					aria-hidden
					className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
				/>
			</span>
		</label>
	);
}

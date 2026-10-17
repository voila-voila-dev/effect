import type * as React from "react";
import { Input } from "#/input/components/input.tsx";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<typeof Input> {}

/**
 * The kit input with a calmer focus: a text field grabs `:focus-visible` on
 * every click, so the kit's 3px halo glows on each field of a panel someone is
 * merely filling in. A tinted border plus a hairline ring marks focus without
 * the glow.
 */
export function FilterFieldInput({ className, ...props }: Props) {
	return (
		<Input
			data-slot="filter-field-input"
			className={cn(
				"focus-visible:ring-1 focus-visible:ring-ring/40",
				className,
			)}
			{...props}
		/>
	);
}

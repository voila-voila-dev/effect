import type * as React from "react";
import type { DateRangeFilterValue, DateRangePreset } from "#/filter/types.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"fieldset"> {
	presets: ReadonlyArray<DateRangePreset>;
	value: DateRangeFilterValue | undefined;
	onValueChange: (value: DateRangeFilterValue) => void;
}

/**
 * The shortcut row above a date range's bounds. The preset whose bounds match
 * the value reads as pressed, like a selected select option, so a hand-picked
 * range that happens to equal "30 days" says so.
 */
export function DatePresetRow({
	presets,
	value,
	onValueChange,
	className,
	...props
}: Props) {
	return (
		<fieldset
			data-slot="filter-date-presets"
			className={cn("flex flex-wrap gap-2", className)}
			{...props}
		>
			{presets.map((preset) => {
				const selected = value?.from === preset.from && value?.to === preset.to;
				return (
					<button
						key={preset.label}
						type="button"
						aria-pressed={selected}
						onClick={() =>
							onValueChange({
								kind: "dateRange",
								from: preset.from,
								to: preset.to,
							})
						}
						className={cn(
							"inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
							"focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
							selected
								? "border-primary bg-primary text-primary-foreground"
								: "border-input bg-background text-foreground hover:bg-accent",
						)}
					>
						{preset.label}
					</button>
				);
			})}
		</fieldset>
	);
}

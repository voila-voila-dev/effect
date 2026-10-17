import { Filter, type FilterValues } from "@voila.dev/ui/filter";
import { useState } from "react";
import { ALL } from "./fixtures";

const ROWS = [
	"Welcome aboard",
	"Your invoice is ready",
	"Password changed",
	"Weekly digest",
	"A new device signed in",
];

/** The bar's button toggles a rail docked beside the rows it narrows. */
export function Docked() {
	const [values, setValues] = useState<FilterValues>({});
	const [search, setSearch] = useState("");
	// Closed at first: on a phone the dock is a drawer, and one that opens on
	// page load would cover the page.
	const [open, setOpen] = useState(false);
	return (
		<div className="flex w-full flex-col gap-4">
			<Filter.Root
				mode="live"
				definitions={ALL}
				values={values}
				onValuesChange={setValues}
				searchValue={search}
				onSearchChange={setSearch}
				resultCount={ROWS.length}
				open={open}
				onOpenChange={setOpen}
				panelRenderedElsewhere
			/>
			<div className="flex min-w-0 gap-4">
				<ul className="flex min-w-0 flex-1 flex-col divide-y rounded-xl border">
					{ROWS.map((row) => (
						<li key={row} className="truncate px-4 py-3 text-sm">
							{row}
						</li>
					))}
				</ul>
				<Filter.Dock
					open={open}
					onOpenChange={setOpen}
					definitions={ALL}
					values={values}
					onValuesChange={setValues}
					className="static max-h-[28rem]"
				/>
			</div>
		</div>
	);
}

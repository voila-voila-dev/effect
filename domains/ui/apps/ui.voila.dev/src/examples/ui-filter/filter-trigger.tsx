import { defaultFilterLabels, Filter } from "@voila.dev/ui/filter";
import { useState } from "react";

export function Trigger() {
	return (
		<div className="w-full max-w-md">
			<Filter.Trigger
				summary="name@example.com"
				activeCount={2}
				labels={defaultFilterLabels}
				onClick={() => {}}
			/>
		</div>
	);
}

/** The live bar's pair: a real search input and the "Filters" button. */
export function SearchAndButton() {
	const [search, setSearch] = useState("");
	return (
		<div className="flex w-full max-w-lg items-center gap-2">
			<Filter.SearchInput
				value={search}
				onValueChange={setSearch}
				className="min-w-0 flex-1"
			/>
			<Filter.Button activeCount={2} onClick={() => {}} />
		</div>
	);
}

import {
	encodeFilterValues,
	Filter,
	type FilterValues,
} from "@voila.dev/ui/filter";
import { useState } from "react";
import { ALL } from "./fixtures";

/** Every change re-encodes the record: this is the query string a router would carry. */
export function UrlState() {
	const [values, setValues] = useState<FilterValues>({
		status: { kind: "select", values: ["failed", "bounced"] },
		customer: {
			kind: "entity",
			entities: [{ id: "cus_acme", label: "Acme Corporation" }],
			excluded: true,
		},
	});
	const query = new URLSearchParams(encodeFilterValues(ALL, values));
	return (
		<div className="flex w-full flex-col gap-4">
			<Filter.Root
				mode="live"
				definitions={ALL}
				values={values}
				onValuesChange={setValues}
			/>
			<code className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
				{`?${decodeURIComponent(query.toString())}`}
			</code>
		</div>
	);
}

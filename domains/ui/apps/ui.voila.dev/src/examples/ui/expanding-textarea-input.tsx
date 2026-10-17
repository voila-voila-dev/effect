import { ExpandingTextareaInput } from "@voila.dev/ui/expanding-textarea-input";
import { useState } from "react";

export function Default() {
	const [value, setValue] = useState(
		"Bring the signed brief.\nParking is behind the building.",
	);
	return (
		<div className="w-full max-w-xs rounded-lg border">
			<ExpandingTextareaInput
				value={value}
				onValueChange={setValue}
				ariaLabel="Notes"
				placeholder="Add a note"
			/>
		</div>
	);
}

export function InATable() {
	const [notes, setNotes] = useState<Record<string, string>>({
		design: "Two rounds of review.\nFigma file shared on Monday.",
		build: "",
	});
	return (
		<table className="w-full max-w-md border-collapse text-sm">
			<thead>
				<tr className="border-b text-left text-muted-foreground">
					<th className="px-2.5 py-2 font-medium">Phase</th>
					<th className="px-2.5 py-2 font-medium">Notes</th>
				</tr>
			</thead>
			<tbody>
				{Object.entries(notes).map(([phase, note]) => (
					<tr key={phase} className="border-b">
						<td className="px-2.5 capitalize">{phase}</td>
						<td className="w-2/3 border-l">
							<ExpandingTextareaInput
								value={note}
								onValueChange={(next) =>
									setNotes((current) => ({ ...current, [phase]: next }))
								}
								ariaLabel={`Notes for ${phase}`}
								placeholder="—"
							/>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

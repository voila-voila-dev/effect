import {
	type Applicability,
	contextCombinations,
	contextMismatches,
	type ReaderContext,
	type ReaderDimensions,
} from "./reader-context.ts";

export interface CoverageEntry {
	id: string;
	appliesTo: Applicability | undefined;
	planned: boolean;
}

/** One full context of an audience, and what answers it. */
export interface CoverageCell {
	context: ReaderContext;
	paths: Array<string>;
	planned: Array<string>;
}

/** For every full context an audience can be in, the paths written for it and the ones planned. */
export function contextCoverage({
	dimensions,
	audience,
	entries,
}: {
	dimensions: ReaderDimensions;
	audience: string;
	entries: ReadonlyArray<CoverageEntry>;
}): Array<CoverageCell> {
	return contextCombinations(dimensions, audience).map((context) => {
		const answering = entries.filter(
			(entry) => contextMismatches(entry.appliesTo, context).length === 0,
		);
		return {
			context,
			paths: answering.filter((entry) => !entry.planned).map(({ id }) => id),
			planned: answering.filter((entry) => entry.planned).map(({ id }) => id),
		};
	});
}

function cellText(cells: ReadonlyArray<CoverageCell>): string {
	const paths = cells.flatMap((cell) => cell.paths);
	const planned = cells.flatMap((cell) => cell.planned);
	if (paths.length > 0) {
		return paths.join(", ");
	}
	return planned.length > 0 ? `planned: ${planned.join(", ")}` : "MISSING";
}

/** The coverage as a text table: one row per value of `rows`, one column per value of `columns` (a single column without one). */
export function coverageTable({
	dimensions,
	cells,
	rows,
	columns,
}: {
	dimensions: ReaderDimensions;
	cells: ReadonlyArray<CoverageCell>;
	rows: string;
	columns?: string | undefined;
}): string {
	const rowValues = dimensions[rows]?.values ?? [];
	const columnValues = columns ? (dimensions[columns]?.values ?? []) : [];
	const header = [
		columns ? `${rows} \\ ${columns}` : rows,
		...(columns ? columnValues : ["paths"]),
	];
	const body = rowValues.map((row) => {
		const inRow = cells.filter((cell) => cell.context[rows] === row);
		return [
			row,
			...(columns
				? columnValues.map((column) =>
						cellText(inRow.filter((cell) => cell.context[columns] === column)),
					)
				: [cellText(inRow)]),
		];
	});
	const table = [header, ...body];
	const widths = header.map((_, index) =>
		Math.max(...table.map((line) => (line[index] ?? "").length)),
	);
	return table
		.map((line) =>
			line
				.map((text, index) => text.padEnd(widths[index] ?? 0))
				.join(" | ")
				.trimEnd(),
		)
		.join("\n");
}

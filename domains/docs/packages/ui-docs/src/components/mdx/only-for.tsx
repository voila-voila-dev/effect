import { applicabilityProblems } from "@voila.dev/docs/reader-context";
import type { ReactNode } from "react";

import { useReaderContext } from "../reader-context.tsx";

function valuesOf(restriction: unknown): Array<string> {
	if (typeof restriction === "string") {
		return restriction.split(",").map((value) => value.trim());
	}
	return Array.isArray(restriction)
		? restriction.filter((value) => typeof value === "string")
		: [];
}

/**
 * A sentence or two written for some readers only:
 * `<OnlyFor businessCountry="LU">…</OnlyFor>`. Without a context every variant
 * shows, labelled, so the prerendered HTML holds them all; once the reader
 * chose, the others hide.
 */
export function OnlyFor({
	children,
	...restrictions
}: { children?: ReactNode } & Readonly<Record<string, unknown>>) {
	const { dimensions, restrictionLabel, matches, restrictionsOf } =
		useReaderContext();
	const appliesTo = Object.fromEntries(
		Object.entries(restrictions).map(([name, restriction]) => [
			name,
			valuesOf(restriction),
		]),
	);
	const problems = applicabilityProblems({
		dimensions,
		appliesTo,
		audiences: Object.values(dimensions).flatMap(
			(dimension) => dimension.audiences,
		),
	});
	if (problems.length > 0 || Object.keys(appliesTo).length === 0) {
		throw new Error(
			`<OnlyFor> names no reader context, or a wrong one: ${problems
				.map((problem) => `${problem.dimension} ${problem.message}`)
				.join("; ")}`,
		);
	}
	return (
		<div
			hidden={!matches(appliesTo)}
			className="border-foreground/15 border-l-2 pl-4 [&>*+*]:mt-2"
		>
			<p className="font-medium text-muted-foreground text-xs">
				{restrictionLabel(restrictionsOf(appliesTo))}
			</p>
			{children}
		</div>
	);
}

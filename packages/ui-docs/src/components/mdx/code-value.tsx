import { useDocs } from "../docs-provider.tsx";

/**
 * A value that lives in code (a fee, a delay, an invoice mention), so a page never types it and never drifts from it.
 * It wraps like prose, since some are sentences: a value that must stay on one line carries non-breaking spaces, as `Intl` output does.
 */
export function CodeValue({ name }: { name: string }) {
	const { constants } = useDocs();
	const value = constants[name];
	if (value === undefined) {
		throw new Error(
			`<CodeValue name="${name}" /> names no docs constant (${Object.keys(constants).join(", ") || "none declared"})`,
		);
	}
	return <span>{value}</span>;
}

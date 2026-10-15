/**
 * The name a use case declared in `file` must carry: `<context>.<file name
 * without -use-case.ts>`, so `billing/use-cases/issue-invoice-use-case.ts`
 * declares `billing.issue-invoice`.
 */
export function useCaseNameOf(
	file: string,
	contextOf: (path: string) => string,
): string {
	const base = file.slice(file.lastIndexOf("/") + 1).replace(/\.ts$/u, "");
	return `${contextOf(file)}.${base.replace(/-use-case$/u, "")}`;
}

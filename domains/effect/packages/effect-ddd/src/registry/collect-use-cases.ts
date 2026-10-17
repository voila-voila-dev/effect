import type { AnyUseCase } from "../use-case/use-case.ts";

export function isUseCase(value: unknown): value is AnyUseCase {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value as Partial<Record<keyof AnyUseCase, unknown>>;
	return (
		typeof candidate.name === "string" &&
		typeof candidate.execute === "function" &&
		typeof candidate.gate === "object" &&
		candidate.gate !== null &&
		candidate.Input !== undefined
	);
}

/**
 * Every use case the modules export, in module order. Pass the namespace
 * imports of each context's `use-cases/index.ts`, so adding a use case to an
 * index is all it takes to register it.
 */
export function collectUseCases(
	modules: ReadonlyArray<Readonly<Record<string, unknown>>>,
): ReadonlyArray<AnyUseCase> {
	return modules.flatMap((module) => Object.values(module).filter(isUseCase));
}

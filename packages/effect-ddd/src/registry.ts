import { type PermissionRef, renderPermissionRef } from "./permission-ref.ts";
import type { AnyUseCase } from "./use-case.ts";

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

/**
 * What is wrong between the registered use cases and the names their files
 * imply: a name registered twice, a name no file backs, a file whose use case
 * was never registered. Pure, so a test can prove it fails on a fixture.
 */
export function registryProblems(
	units: ReadonlyArray<{ readonly name: string }>,
	expectedNames: ReadonlyArray<string>,
): ReadonlyArray<string> {
	const expected = new Set(expectedNames);
	const registered = new Set(units.map((unit) => unit.name));
	return [
		...units.flatMap((unit, index) => [
			...(units.findIndex((other) => other.name === unit.name) === index
				? []
				: [`duplicate use case name: ${unit.name}`]),
			...(expected.has(unit.name)
				? []
				: [`use case "${unit.name}" is named after no use-case file`]),
		]),
		...[...expected]
			.filter((name) => !registered.has(name))
			.map((name) => `use case "${name}" is declared but not registered`),
	];
}

/**
 * The gates naming a permission the application does not know. `known` maps
 * each permission kind to its names; a kind missing from it is unknown too.
 */
export function unknownPermissions(
	units: ReadonlyArray<AnyUseCase>,
	known: Readonly<Record<string, ReadonlyArray<string>>>,
): ReadonlyArray<string> {
	return units.flatMap((unit) =>
		unit.gate.permissions
			.filter((ref: PermissionRef) => !known[ref.kind]?.includes(ref.name))
			.map((ref: PermissionRef) => `${unit.name}: ${renderPermissionRef(ref)}`),
	);
}

/** Which use cases each permission opens, keyed by `kind:name`: "what does this permission unlock?". */
export function permissionCatalogue(
	units: ReadonlyArray<AnyUseCase>,
): ReadonlyMap<string, ReadonlyArray<string>> {
	const catalogue = new Map<string, Array<string>>();
	for (const unit of units) {
		for (const ref of unit.gate.permissions as ReadonlyArray<PermissionRef>) {
			const key = renderPermissionRef(ref);
			catalogue.set(key, [...(catalogue.get(key) ?? []), unit.name]);
		}
	}
	return catalogue;
}

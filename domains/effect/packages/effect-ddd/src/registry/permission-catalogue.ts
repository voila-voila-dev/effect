import {
	type PermissionRef,
	renderPermissionRef,
} from "../permission/permission-ref.ts";
import type { AnyUseCase } from "../use-case/use-case.ts";

function permissionsOf(unit: AnyUseCase): ReadonlyArray<PermissionRef> {
	return unit.gate.permissions;
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
		permissionsOf(unit)
			.filter((ref) => !known[ref.kind]?.includes(ref.name))
			.map((ref) => `${unit.name}: ${renderPermissionRef(ref)}`),
	);
}

/** Which use cases each permission opens, keyed by `kind:name`: "what does this permission unlock?". */
export function permissionCatalogue(
	units: ReadonlyArray<AnyUseCase>,
): ReadonlyMap<string, ReadonlyArray<string>> {
	const catalogue = new Map<string, Array<string>>();
	for (const unit of units) {
		for (const ref of permissionsOf(unit)) {
			const key = renderPermissionRef(ref);
			catalogue.set(key, [...(catalogue.get(key) ?? []), unit.name]);
		}
	}
	return catalogue;
}

import type { HostResolver } from "./host-resolver.ts";

/** A resolver answering from a table, so no test reaches real DNS; an unknown host fails to resolve. */
export function hostTable(
	table: Readonly<Record<string, ReadonlyArray<string>>>,
): HostResolver {
	return async (hostname) => {
		const addresses = table[hostname];
		if (addresses === undefined) throw new Error(`ENOTFOUND ${hostname}`);
		return addresses;
	};
}

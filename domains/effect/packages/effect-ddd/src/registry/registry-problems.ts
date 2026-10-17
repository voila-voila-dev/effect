interface Named {
	readonly name: string;
}

function duplicates(units: ReadonlyArray<Named>): ReadonlyArray<string> {
	return units
		.filter(
			(unit, index) =>
				units.findIndex((other) => other.name === unit.name) !== index,
		)
		.map((unit) => `duplicate use case name: ${unit.name}`);
}

function unbacked(
	units: ReadonlyArray<Named>,
	expected: ReadonlySet<string>,
): ReadonlyArray<string> {
	return units
		.filter((unit) => !expected.has(unit.name))
		.map((unit) => `use case "${unit.name}" is named after no use-case file`);
}

function unregistered(
	units: ReadonlyArray<Named>,
	expected: ReadonlySet<string>,
): ReadonlyArray<string> {
	const registered = new Set(units.map((unit) => unit.name));
	return [...expected]
		.filter((name) => !registered.has(name))
		.map((name) => `use case "${name}" is declared but not registered`);
}

/**
 * What is wrong between the registered use cases and the names their files
 * imply: a name registered twice, a name no file backs, a file whose use case
 * was never registered. Pure, so a test can prove it fails on a fixture.
 */
export function registryProblems(
	units: ReadonlyArray<Named>,
	expectedNames: ReadonlyArray<string>,
): ReadonlyArray<string> {
	const expected = new Set(expectedNames);
	return [
		...duplicates(units),
		...unbacked(units, expected),
		...unregistered(units, expected),
	];
}

/**
 * One permission a gate asks for, in a shape a catalogue can index:
 * `{ kind: "organization", name: "invoice.manage" }`,
 * `{ kind: "actor", name: "system" }`. The kinds and names are the
 * application's own vocabulary.
 */
export interface PermissionRef {
	readonly kind: string;
	readonly name: string;
}

export function permissionRef(kind: string, name: string): PermissionRef {
	return { kind, name };
}

/** `kind:name`, the form a span attribute and a catalogue key use. */
export function renderPermissionRef(ref: PermissionRef): string {
	return `${ref.kind}:${ref.name}`;
}

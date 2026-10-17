/**
 * The `_tag` of the input's actor — `UserActor`, `SystemActor` — or `none` for
 * a flow that runs before a session exists.
 */
export function actorKind(input: Readonly<Record<string, unknown>>): string {
	const actor = input.actor;
	return typeof actor === "object" &&
		actor !== null &&
		"_tag" in actor &&
		typeof actor._tag === "string"
		? actor._tag
		: "none";
}

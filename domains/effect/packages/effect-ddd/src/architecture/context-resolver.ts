/**
 * The context a path belongs to: its first folder, unless that folder only
 * groups contexts (`platform/`), in which case the context is one level
 * deeper. Grouping folders may nest (`platform/integrations`).
 */
export function contextResolver(
	options: { readonly groupingDirectories?: ReadonlyArray<string> } = {},
): (path: string) => string {
	const grouping = new Set(options.groupingDirectories ?? []);
	return (path) => {
		const segments = path.split("/");
		let depth = 1;
		while (
			depth < segments.length - 1 &&
			grouping.has(segments.slice(0, depth).join("/"))
		) {
			depth += 1;
		}
		return segments.slice(0, depth).join("/");
	};
}

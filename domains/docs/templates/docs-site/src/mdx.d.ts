declare module "*.mdx" {
	import type { ComponentType } from "react";

	/** YAML frontmatter, exported by remark-mdx-frontmatter. */
	export const frontmatter: unknown;

	/** The h2/h3 outline, exported by `@voila.dev/docs/mdx/plugin`. */
	export const headings: ReadonlyArray<
		import("@voila.dev/docs/heading").DocHeading
	>;

	const MdxContent: ComponentType<{
		components?: Record<string, ComponentType<never>>;
	}>;
	export default MdxContent;
}

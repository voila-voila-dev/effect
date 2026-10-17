import { docsConfig } from "../../docs.config.ts";

/**
 * A page's `<head>`: its title after the site's, its description and its
 * canonical URL. Every page is prerendered to `<path>/index.html`, which the
 * Worker serves at `<path>/`, so that is the canonical form.
 */
export function pageHead({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href: string;
}) {
	const url = new URL(href === "/" ? href : `${href}/`, docsConfig.url).href;
	const fullTitle = `${title} · ${docsConfig.name}`;
	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			{ property: "og:title", content: fullTitle },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
		],
		links: [{ rel: "canonical", href: url }],
	};
}

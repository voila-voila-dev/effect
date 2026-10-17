import { docsConfig } from "../../docs.config.ts";

/** A page's `<head>`: its title after the site's, its description and canonical URL. */
export function pageHead({
	title,
	description,
	href,
}: {
	title: string;
	description: string;
	href: string;
}) {
	const url = new URL(href, docsConfig.url).href;
	const fullTitle =
		title === docsConfig.name ? title : `${title} · ${docsConfig.name}`;
	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			{ property: "og:title", content: fullTitle },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
			{ property: "og:site_name", content: docsConfig.name },
		],
		links: [{ rel: "canonical", href: url }],
	};
}

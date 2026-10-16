const MARKDOWN_LINK = /\]\((\/[^)\s]*)\)/gu;
const JSX_HREF = /\bhref="(\/[^"]*)"/gu;

/** The site-relative links an MDX source holds, Markdown and JSX `href` alike, without their query or fragment. */
export function internalLinksIn(source: string): Array<string> {
	return [...source.matchAll(MARKDOWN_LINK), ...source.matchAll(JSX_HREF)].map(
		([, href = ""]) => href.replace(/[?#].*$/u, ""),
	);
}

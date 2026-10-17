import type {
	AnyContentNodeReader,
	ContentFeatureReader,
} from "#/content-editor/features/reader-definition.tsx";
import { escapeHtml } from "#/content-editor/reader/escape-html.ts";
import {
	type ArticleFigureOptions,
	articleFigureNode,
} from "#/landing/lib/article-figure.tsx";

export interface ArticleReadersOptions {
	/** How images become figures; see `articleFigureNode`. */
	readonly figure?: ArticleFigureOptions;
	/** The name of a heading's own link, the `#` shown on hover. */
	readonly headingAnchor?: string;
	/** The name of a table's scrolling frame, which a keyboard can focus. */
	readonly tableRegion?: string;
	/**
	 * Extra features appended after the base ones. One whose `key` matches a
	 * base reader replaces it — the way a site brings its own callout, chart
	 * or embed without forking the rest.
	 */
	readonly features?: ReadonlyArray<ContentFeatureReader>;
}

const ANCHORED_HEADINGS = new Set(["h2", "h3"]);

function withAnchor(
	node: AnyContentNodeReader,
	label: string,
): AnyContentNodeReader {
	return {
		...node,
		toHtml: (heading, children, options, parts) => {
			const id = options.idFor?.(heading) ?? heading.id;
			const anchor =
				typeof id === "string"
					? `<a href="#${escapeHtml(id)}" class="article-anchor" aria-label="${escapeHtml(label)}">#</a>`
					: "";
			return node.toHtml(heading, `${children}${anchor}`, options, parts);
		},
	};
}

function withScrollFrame(
	node: AnyContentNodeReader,
	label: string,
): AnyContentNodeReader {
	return {
		...node,
		toHtml: (table, children, options, parts) =>
			`<div class="article-table" role="region" aria-label="${escapeHtml(label)}" tabindex="0">${node.toHtml(table, children, options, parts)}</div>`,
	};
}

/**
 * Readers this module already adapted, so a reader set passed through
 * `withArticleReaders` twice (a shared base, then a site's own pass) does not
 * print two anchors per heading or nest two scroll frames.
 */
const adaptedReaders = new WeakSet<AnyContentNodeReader>();

function adaptedNode(
	node: AnyContentNodeReader,
	headingAnchor: string,
	tableRegion: string,
): AnyContentNodeReader {
	if (adaptedReaders.has(node)) return node;
	const adapted = ANCHORED_HEADINGS.has(node.type)
		? withAnchor(node, headingAnchor)
		: node.type === "table"
			? withScrollFrame(node, tableRegion)
			: null;
	if (adapted === null) return node;
	adaptedReaders.add(adapted);
	return adapted;
}

/**
 * Content-editor readers set for a long-form article inside `ProseArticle`:
 * `h2`/`h3` get a hover `#` link to themselves (`.article-anchor`), tables a
 * focusable, sideways-scrolling frame (`.article-table`), and images become
 * captioned figures with a zoom button. The classes are styled by
 * `@voila.dev/ui/styles/landing.css`; the anchors and frames are added to the
 * HTML output (`contentToHtml`), which is what a statically rendered article
 * ships.
 */
export function withArticleReaders(
	readers: ReadonlyArray<ContentFeatureReader>,
	{
		figure,
		headingAnchor = "Link to this section",
		tableRegion = "Scrollable table",
		features = [],
	}: ArticleReadersOptions = {},
): ReadonlyArray<ContentFeatureReader> {
	const figureReader: ContentFeatureReader = {
		key: "image",
		nodes: [articleFigureNode(figure)],
	};
	const own = features.some((reader) => reader.key === figureReader.key)
		? features
		: [figureReader, ...features];
	const replaced = new Set(own.map((reader) => reader.key));
	return [
		...readers
			.filter((reader) => !replaced.has(reader.key))
			.map((reader) => ({
				...reader,
				nodes: reader.nodes?.map((node) =>
					adaptedNode(node, headingAnchor, tableRegion),
				),
			})),
		...own,
	];
}

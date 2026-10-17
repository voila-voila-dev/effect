import type { ContentImageNode } from "#/content-editor/features/image/reader.tsx";
import type { ContentNodeReader } from "#/content-editor/features/reader-definition.tsx";
import { escapeHtml, escapeUrl } from "#/content-editor/reader/escape-html.ts";
import { ARTICLE_ZOOM_ATTRIBUTE } from "#/landing/lib/article-zoom.ts";

export interface ArticleFigureOptions {
	/**
	 * The `srcset` of an image the host can resize, one candidate per width;
	 * `undefined` leaves the image at its single `src`. Omit it when the host
	 * cannot resize images.
	 */
	readonly srcSet?: (src: string) => string | undefined;
	/** How wide the image is drawn, for the browser to pick a candidate. */
	readonly sizes?: string;
	/** The name of the button that opens the image full screen. */
	readonly zoomLabel?: (alt: string) => string;
}

const FIGURE = "not-prose my-10 flex flex-col gap-3";
const IMAGE = "h-auto w-full rounded-2xl border border-border/60 bg-muted";
const CAPTION = "text-center text-muted-foreground text-sm leading-relaxed";
const ZOOM = "block w-full cursor-zoom-in rounded-2xl";

function defaultZoomLabel(alt: string): string {
	return alt === "" ? "Enlarge image" : `Enlarge image: ${alt}`;
}

function responsiveAttributes(
	url: string,
	options: ArticleFigureOptions,
): string {
	const srcSet = options.srcSet?.(url);
	if (srcSet === undefined) return "";
	const sizes = options.sizes ?? "100vw";
	return ` srcset="${escapeHtml(srcSet)}" sizes="${escapeHtml(sizes)}"`;
}

function sizeAttributes(node: ContentImageNode): string {
	return node.width === undefined || node.height === undefined
		? ""
		: ` width="${node.width}" height="${node.height}"`;
}

function framedHtml(
	node: ContentImageNode,
	image: string,
	zoomLabel: string,
): string {
	return node.href !== undefined && node.href !== ""
		? `<a href="${escapeUrl(node.href)}">${image}</a>`
		: `<button type="button" ${ARTICLE_ZOOM_ATTRIBUTE} aria-label="${escapeHtml(zoomLabel)}" class="${ZOOM}">${image}</button>`;
}

function captionHtml(caption: string | undefined): string {
	return caption === undefined || caption === ""
		? ""
		: `<figcaption class="${CAPTION}">${escapeHtml(caption)}</figcaption>`;
}

/** The figure's markup — one string, so `Render` and `toHtml` cannot drift. */
export function articleFigureHtml(
	node: ContentImageNode,
	options: ArticleFigureOptions,
	id: string | undefined,
): string {
	// An image still uploading has no URL yet: nothing to draw.
	if (node.url === "") return "";
	const alt = node.alt ?? node.caption ?? "";
	const zoomLabel = (options.zoomLabel ?? defaultZoomLabel)(alt);
	const image = `<img src="${escapeUrl(node.url)}"${responsiveAttributes(node.url, options)} alt="${escapeHtml(alt)}"${sizeAttributes(node)} loading="lazy" decoding="async" class="${IMAGE}">`;
	const idAttribute = id === undefined ? "" : ` id="${escapeHtml(id)}"`;
	return `<figure${idAttribute} class="${FIGURE}">${framedHtml(node, image, zoomLabel)}${captionHtml(node.caption)}</figure>`;
}

/**
 * The content editor's `image` node read as an article figure: lazy and
 * responsive, captioned, and wrapped in a zoom button (see
 * `ARTICLE_ZOOM_ATTRIBUTE`) unless the image already links somewhere.
 */
export function articleFigureNode(
	options: ArticleFigureOptions = {},
): ContentNodeReader<ContentImageNode> {
	return {
		type: "image",
		kind: "void",
		Render: ({ node, options: html }) => (
			<div
				className="contents"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: articleFigureHtml escapes every value it interpolates and passes its URLs through escapeUrl, and toHtml writes the same markup
				dangerouslySetInnerHTML={{
					__html: articleFigureHtml(
						node,
						options,
						html.idFor?.(node) ?? node.id,
					),
				}}
			/>
		),
		toHtml: (node, _children, html) =>
			articleFigureHtml(node, options, html.idFor?.(node) ?? node.id),
	};
}

import { describe, expect, it } from "vitest";
import type { ContentValue } from "#/content-editor/features/content-value.ts";
import { contentToHtml } from "#/content-editor/reader/content-to-html.ts";
import { createContentReaders } from "#/content-editor/reader/readers.ts";
import { withArticleReaders } from "#/landing/lib/article-readers.ts";

const readers = withArticleReaders(createContentReaders(), {
	figure: {
		srcSet: (src) => `${src}?w=480 480w, ${src}?w=800 800w`,
		sizes: "100vw",
		zoomLabel: (alt) => `Zoom: ${alt}`,
	},
	headingAnchor: "Link here",
	tableRegion: "Scrolling table",
	features: [
		{
			key: "embed",
			nodes: [
				{
					type: "embed",
					kind: "void",
					Render: () => null,
					toHtml: () => '<div data-embed=""></div>',
				},
			],
		},
	],
});

function html(body: ContentValue, features = readers): string {
	return contentToHtml(body, { features });
}

function paragraph(text: string) {
	return { type: "p", children: [{ text }] };
}

describe("withArticleReaders", () => {
	it("draws an image as a lazy, captioned figure in every width", () => {
		expect(
			html([
				{
					type: "image",
					url: "/media/a.webp",
					alt: "A taped ankle",
					caption: "Before the match",
					width: 1200,
					height: 800,
					children: [{ text: "" }],
				},
			]),
		).toBe(
			'<figure class="not-prose my-10 flex flex-col gap-3"><button type="button" data-article-zoom aria-label="Zoom: A taped ankle" class="block w-full cursor-zoom-in rounded-2xl"><img src="/media/a.webp" srcset="/media/a.webp?w=480 480w, /media/a.webp?w=800 800w" sizes="100vw" alt="A taped ankle" width="1200" height="800" loading="lazy" decoding="async" class="h-auto w-full rounded-2xl border border-border/60 bg-muted"></button><figcaption class="text-center text-muted-foreground text-sm leading-relaxed">Before the match</figcaption></figure>',
		);
	});

	it("links an image with an href instead of offering a zoom", () => {
		const printed = html([
			{
				type: "image",
				url: "/media/a.webp",
				href: "https://example.com",
				children: [{ text: "" }],
			},
		]);
		expect(printed).toContain('<a href="https://example.com"><img');
		expect(printed).not.toContain("data-article-zoom");
	});

	it("prints nothing for an image still uploading", () => {
		expect(html([{ type: "image", url: "", children: [{ text: "" }] }])).toBe(
			"",
		);
	});

	it("links a heading to itself and frames a table that may scroll", () => {
		expect(
			html([
				{ type: "h2", id: "pricing", children: [{ text: "Pricing" }] },
				{
					type: "table",
					children: [
						{
							type: "tr",
							children: [{ type: "td", children: [paragraph("90")] }],
						},
					],
				},
			]),
		).toBe(
			'<h2 id="pricing">Pricing<a href="#pricing" class="article-anchor" aria-label="Link here">#</a></h2><div class="article-table" role="region" aria-label="Scrolling table" tabindex="0"><table><tbody><tr><td>90</td></tr></tbody></table></div>',
		);
	});

	it("appends extra features and lets one replace a base reader by key", () => {
		expect(html([{ type: "embed", children: [{ text: "" }] }])).toBe(
			'<div data-embed=""></div>',
		);

		const replaced = withArticleReaders(createContentReaders(), {
			features: [
				{
					key: "image",
					nodes: [
						{
							type: "image",
							kind: "void",
							Render: () => null,
							toHtml: () => "<img-replaced>",
						},
					],
				},
			],
		});
		expect(
			html(
				[{ type: "image", url: "/a.webp", children: [{ text: "" }] }],
				replaced,
			),
		).toBe("<img-replaced>");
	});

	it("adapts a heading once when applied twice", () => {
		const twice = withArticleReaders(
			withArticleReaders(createContentReaders()),
		);
		const printed = html(
			[{ type: "h2", id: "x", children: [{ text: "X" }] }],
			twice,
		);
		expect(printed.match(/article-anchor/gu)?.length).toBe(1);
	});

	it("falls back to English labels and a single src", () => {
		const plain = withArticleReaders(createContentReaders());
		const printed = html(
			[
				{ type: "h3", id: "x", children: [{ text: "X" }] },
				{ type: "image", url: "/a.webp", alt: "Alt", children: [{ text: "" }] },
			],
			plain,
		);
		expect(printed).toContain('aria-label="Link to this section"');
		expect(printed).toContain('aria-label="Enlarge image: Alt"');
		expect(printed).not.toContain("srcset");
	});
});

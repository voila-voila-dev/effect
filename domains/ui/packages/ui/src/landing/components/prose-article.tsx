import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"article"> {}

/**
 * Long-form prose wrapper (blog articles, legal pages). Requires
 * `@plugin "@tailwindcss/typography"` in the consuming app's stylesheet.
 *
 * Set for reading: 17 px on a phone and 18 px from `md`, at 1.65, in a 40rem
 * measure (about 68 characters a line). Pair it with `.article-table`,
 * `.article-anchor` and `.article-progress` from `styles/landing.css`.
 */
export function ProseArticle({ className, render, ...props }: Props) {
	return useRender({
		defaultTagName: "article",
		props: mergeProps<"article">(
			{
				className: cn(
					"prose md:prose-lg mx-auto w-full max-w-[40rem] text-[1.0625rem] leading-[1.65] md:text-lg md:leading-[1.65]",
					"prose-blockquote:rounded-e-lg prose-blockquote:border-s-brand prose-blockquote:bg-muted/50 prose-blockquote:px-6 prose-blockquote:py-1 prose-blockquote:not-italic",
					// A quote writes its own quotation marks; the typography plugin's doubled them.
					"[&_blockquote_p]:before:content-none [&_blockquote_p]:after:content-none",
					// Long reading in grey tires the eye: near-black text, the key ideas darker and marked.
					"prose-li:text-foreground/80 prose-p:text-foreground/80",
					"prose-a:text-brand prose-a:underline-offset-4",
					"prose-strong:font-semibold prose-strong:text-foreground prose-strong:[background:linear-gradient(transparent_60%,color-mix(in_oklch,var(--brand)_14%,transparent)_60%)]",
					"prose-headings:scroll-mt-24 prose-headings:text-balance prose-headings:text-foreground prose-headings:tracking-tight",
					"prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-2xl prose-h2:leading-tight md:prose-h2:mt-14 md:prose-h2:text-[1.75rem]",
					"prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-h3:leading-snug md:prose-h3:text-[1.375rem]",
					"prose-li:my-1.5 prose-li:marker:text-brand",
					"prose-img:rounded-xl",
					className,
				),
			},
			props,
		),
		render,
		state: {
			slot: "prose-article",
		},
	});
}

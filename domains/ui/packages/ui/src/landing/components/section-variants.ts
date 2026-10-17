import { cva, type VariantProps } from "#/lib/cva.ts";

export const sectionVariants = cva({
	base: "relative",
	variants: {
		/**
		 * Vertical padding, which grows at `md` and up. Phones get about 40% less
		 * than desktop: two stacked bands at the desktop rhythm leave 150-250 px
		 * of blank between sections. `none` when the section supplies its own
		 * rhythm.
		 */
		spacing: {
			none: "",
			sm: "py-7 md:py-16",
			md: "py-10 md:py-24",
			lg: "py-14 md:py-32",
			xl: "py-20 md:py-40",
		},
		/**
		 * Surface behind the section. The three gradients read as brand moments —
		 * one per page is usually enough. `brand` also flips the foreground to
		 * `brand-foreground`.
		 */
		background: {
			default: "bg-background",
			muted: "bg-muted",
			brand: "bg-brand text-brand-foreground",
			gradient: "bg-gradient-to-br from-background via-background to-muted",
			"gradient-primary":
				"bg-gradient-to-br from-primary/5 via-background to-primary/10",
			"gradient-brand":
				"bg-gradient-to-br from-brand/5 via-background to-brand/10",
		},
	},
	defaultVariants: {
		spacing: "md",
		background: "default",
	},
});

export type SectionVariants = VariantProps<typeof sectionVariants>;

export const sectionSpacingOptions = [
	"none",
	"sm",
	"md",
	"lg",
	"xl",
] as const satisfies readonly NonNullable<SectionVariants["spacing"]>[];

export const sectionBackgroundOptions = [
	"default",
	"muted",
	"brand",
	"gradient",
	"gradient-primary",
	"gradient-brand",
] as const satisfies readonly NonNullable<SectionVariants["background"]>[];

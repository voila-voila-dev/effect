import { z } from "zod";

import {
	applicabilityProblems,
	type ReaderDimensions,
} from "./reader-context.ts";

/** A `path` orders blocks for one persona; a `guide` is one reusable task; `reference` holds rules and lists; an `explanation` explains. */
export const docKinds = ["path", "guide", "reference", "explanation"] as const;

export type DocKind = (typeof docKinds)[number];

/** The words a site files its pages under: the glyphs, who a page is for, and the moments of a reader's life it belongs to. */
export interface DocVocabulary<
	IconName extends string,
	Audience extends string,
	Stage extends string,
> {
	icons: readonly [IconName, ...Array<IconName>];
	audiences: readonly [Audience, ...Array<Audience>];
	stages: readonly [Stage, ...Array<Stage>];
	/** The facts about the reader a page may be written for (`appliesTo`). */
	dimensions?: ReaderDimensions<Audience>;
}

const slug = z
	.string()
	.regex(
		/^[a-z0-9-]+(\/[a-z0-9-]+)*$/u,
		"a slug is a page's path under its locale folder, without `.mdx`",
	);

const source = z.strictObject({
	label: z.string().min(1),
	href: z.url({ protocol: /^https$/u }),
});

export type DocSource = z.infer<typeof source>;

function requiredMessage(what: string) {
	return (issue: { input: unknown }) =>
		issue.input === undefined ? `${what} is required` : undefined;
}

/** The shared fields the cross-field checks read, whatever a site's extension adds. */
interface CheckedFields {
	sources: ReadonlyArray<unknown>;
	lastVerified?: string | undefined;
	appliesTo?: Record<string, Array<string>> | undefined;
	audience?: ReadonlyArray<string> | undefined;
}

/** What a site adds to the frontmatter on top of the shared fields. */
export interface DocFrontmatterOptions<Extension extends z.ZodRawShape> {
	/**
	 * The site's own fields (`{ category: z.string().optional() }`), validated
	 * with the rest: the schema stays strict, so a key neither declares is
	 * still a typo. A field of the same name replaces the shared one.
	 */
	extend?: Extension;
}

/** The frontmatter every docs page declares. `paths` is never written: it is computed from the path registry. */
export function docFrontmatter<
	IconName extends string,
	Audience extends string,
	Stage extends string,
	// biome-ignore lint/complexity/noBannedTypes: no extension adds no field.
	Extension extends z.ZodRawShape = {},
>(
	vocabulary: DocVocabulary<IconName, Audience, Stage>,
	options: DocFrontmatterOptions<Extension> = {},
) {
	return z
		.strictObject({
			title: z.string().min(1),
			/** A shorter title for the sidebar, where a long one wraps over three lines. */
			sidebarTitle: z.string().min(1).max(32).optional(),
			description: z.string().min(1),
			icon: z.enum(vocabulary.icons).optional(),
			audience: z
				.array(z.enum(vocabulary.audiences), {
					error: requiredMessage(
						`audience (one or more of ${vocabulary.audiences.join(", ")})`,
					),
				})
				.min(1),
			kind: z.enum(docKinds, {
				error: requiredMessage(`kind (one of ${docKinds.join(", ")})`),
			}),
			stage: z.enum(vocabulary.stages).optional(),
			prerequisites: z.array(slug).default([]),
			next: z.array(slug).max(3).default([]),
			sources: z.array(source).default([]),
			lastVerified: z.iso.date().optional(),
			appliesTo: z.record(z.string(), z.array(z.string()).min(1)).optional(),
			/** The same page written for another context: its siblings, listed under "this guide for another context". */
			variants: z.array(slug).default([]),
			...(options.extend ?? ({} as Extension)),
		})
		.check((context) => {
			const { sources, lastVerified } = context.value as CheckedFields;
			if (sources.length > 0 && lastVerified === undefined) {
				context.issues.push({
					code: "custom",
					input: context.value,
					path: ["lastVerified"],
					message:
						"lastVerified (YYYY-MM-DD) is required when the page cites sources",
				});
			}
		})
		.check((context) => {
			const dimensions = vocabulary.dimensions ?? {};
			const { appliesTo, audience } = context.value as CheckedFields;
			for (const problem of applicabilityProblems({
				dimensions,
				appliesTo: appliesTo ?? {},
				audiences: audience ?? [],
			})) {
				context.issues.push({
					code: "custom",
					input: appliesTo,
					path: ["appliesTo", problem.dimension],
					message: problem.message,
				});
			}
		});
}

export type DocFrontmatter<
	IconName extends string = string,
	Audience extends string = string,
	Stage extends string = string,
> = z.output<ReturnType<typeof docFrontmatter<IconName, Audience, Stage>>>;

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

/** The frontmatter every docs page declares. `paths` is never written: it is computed from the path registry. */
export function docFrontmatter<
	IconName extends string,
	Audience extends string,
	Stage extends string,
>(vocabulary: DocVocabulary<IconName, Audience, Stage>) {
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
		})
		.check((context) => {
			if (
				context.value.sources.length > 0 &&
				context.value.lastVerified === undefined
			) {
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
			const { appliesTo, audience } = context.value;
			for (const problem of applicabilityProblems({
				dimensions,
				appliesTo: appliesTo ?? {},
				audiences: audience,
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

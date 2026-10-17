import { z } from "zod";
import { applicabilityProblems, } from "./reader-context.ts";
/** A `path` orders blocks for one persona; a `guide` is one reusable task; `reference` holds rules and lists; an `explanation` explains. */
export const docKinds = ["path", "guide", "reference", "explanation"];
const slug = z
    .string()
    .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/u, "a slug is a page's path under its locale folder, without `.mdx`");
const source = z.strictObject({
    label: z.string().min(1),
    href: z.url({ protocol: /^https$/u }),
});
function requiredMessage(what) {
    return (issue) => issue.input === undefined ? `${what} is required` : undefined;
}
/** The frontmatter every docs page declares. `paths` is never written: it is computed from the path registry. */
export function docFrontmatter(vocabulary) {
    return z
        .strictObject({
        title: z.string().min(1),
        /** A shorter title for the sidebar, where a long one wraps over three lines. */
        sidebarTitle: z.string().min(1).max(32).optional(),
        description: z.string().min(1),
        icon: z.enum(vocabulary.icons).optional(),
        audience: z
            .array(z.enum(vocabulary.audiences), {
            error: requiredMessage(`audience (one or more of ${vocabulary.audiences.join(", ")})`),
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
        if (context.value.sources.length > 0 &&
            context.value.lastVerified === undefined) {
            context.issues.push({
                code: "custom",
                input: context.value,
                path: ["lastVerified"],
                message: "lastVerified (YYYY-MM-DD) is required when the page cites sources",
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

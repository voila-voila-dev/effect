import type { DocsNavigation } from "@voila.dev/docs/navigation";

import type { docsConfig } from "../../../docs.config.ts";

type IconName = keyof typeof docsConfig.icons;

/**
 * The sidebar. `packages/<name>` is the README of the package folder `<name>`; every
 * published package but the UI ones (on ui.voila.dev) has its page, and
 * `docs.test.ts` fails when one is missing.
 */
export const docsNavigation = [
	{
		label: "Start",
		icon: "compass",
		groups: [
			{
				label: "Overview",
				pages: ["index", "guides/getting-started", "guides/docs-site"],
			},
		],
	},
	{
		label: "Backend",
		icon: "code",
		groups: [
			{
				label: "Domain",
				pages: ["packages/effect-ddd", "packages/outbox", "packages/live"],
			},
			{
				label: "Infrastructure",
				pages: [
					"packages/env",
					"packages/http",
					"packages/crypto",
					"packages/cache-lock",
				],
			},
			{
				label: "Tooling",
				pages: ["packages/biome-plugins", "packages/script-kit"],
			},
		],
	},
	{
		label: "Providers",
		icon: "plug",
		groups: [
			{ label: "Email", pages: ["packages/email", "packages/resend"] },
			{ label: "Payments", pages: ["packages/stripe"] },
			{
				label: "Companies",
				pages: ["packages/annuaire-entreprises", "packages/vies"],
			},
		],
	},
	{
		label: "Docs",
		icon: "book",
		groups: [
			{
				label: "Documentation site",
				pages: ["packages/docs", "packages/ui-docs"],
			},
		],
	},
] as const satisfies DocsNavigation<IconName>;

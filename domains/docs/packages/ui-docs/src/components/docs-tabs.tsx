import { cn } from "../lib/cn.ts";

import { DocsLink } from "./docs-link.tsx";
import { useDocs } from "./docs-provider.tsx";

/**
 * The navigation tabs: in the header from lg up, where more tabs than fit
 * scroll sideways, and at the top of the drawer below, where they wrap.
 */
export function DocsTabs({
	onNavigate,
	wrap = false,
}: {
	onNavigate?: () => void;
	wrap?: boolean;
}) {
	const { navigation, messages, icons } = useDocs();
	const { tabs, activeTab } = navigation;
	return (
		<nav
			aria-label={messages.tabsAria}
			className={cn(
				"flex items-center gap-x-6",
				wrap
					? "flex-wrap gap-y-3"
					: "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
			)}
		>
			{tabs.map((tab) => {
				const Icon = tab.icon ? icons[tab.icon] : undefined;
				const current = tab === activeTab;
				return (
					<DocsLink
						key={tab.label}
						href={tab.href}
						onClick={onNavigate}
						aria-current={current ? "page" : undefined}
						className={cn(
							"flex shrink-0 items-center gap-2 whitespace-nowrap text-docs-sm transition-colors",
							current
								? "font-medium text-foreground"
								: "text-foreground/65 hover:text-foreground",
						)}
					>
						{Icon ? <Icon className="size-4" aria-hidden /> : null}
						{tab.label}
					</DocsLink>
				);
			})}
		</nav>
	);
}

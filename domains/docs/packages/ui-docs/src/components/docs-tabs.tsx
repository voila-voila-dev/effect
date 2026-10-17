import { cn } from "../lib/cn.ts";

import { DocsLink } from "./docs-link.tsx";
import { useDocs } from "./docs-provider.tsx";

/** The navigation tabs: in the header from lg up, at the top of the drawer below. */
export function DocsTabs({ onNavigate }: { onNavigate?: () => void }) {
	const { navigation, messages, icons } = useDocs();
	const { tabs, activeTab } = navigation;
	return (
		<nav aria-label={messages.tabsAria} className="flex items-center gap-6">
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
							"flex items-center gap-2 text-docs-sm transition-colors",
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

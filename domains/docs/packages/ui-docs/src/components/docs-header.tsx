import { DotsThreeVerticalIcon, type Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { DocsMenu } from "./docs-menu.tsx";
import { useDocs } from "./docs-provider.tsx";
import { DocsTabs } from "./docs-tabs.tsx";
import { MobileNavigation } from "./mobile-navigation.tsx";
import { SearchIconButton } from "./search/docs-search.tsx";

const NO_MENU_LINKS: ReadonlyArray<never> = [];

export interface DocsMenuLinkItem {
	href: string;
	title: string;
	icon?: Icon;
}

/** The tabs and the host's links, folded into a menu on a phone. */
function MoreMenu({ links }: { links: ReadonlyArray<DocsMenuLinkItem> }) {
	const { navigation, messages, icons } = useDocs();
	return (
		<DocsMenu
			label={messages.moreAria}
			triggerClassName="size-9 rounded-lg"
			trigger={<DotsThreeVerticalIcon className="size-5" weight="bold" />}
			items={[
				...navigation.tabs.map((tab) => ({
					href: tab.href,
					title: tab.label,
					...(tab.icon ? { icon: icons[tab.icon] } : {}),
				})),
				...links,
			]}
		/>
	);
}

export interface DocsHeaderSlots {
	/** The home link at the left: a logo and the docs' name. */
	brand: ReactNode;
	/** The calls to action at the right, from lg up. */
	actions?: ReactNode;
	/** The links the phone menu lists after the tabs. */
	menuLinks?: ReadonlyArray<DocsMenuLinkItem>;
}

export function DocsHeader({
	brand,
	actions,
	menuLinks = NO_MENU_LINKS,
}: DocsHeaderSlots) {
	return (
		<header className="fixed inset-x-0 top-0 z-40 bg-docs-canvas">
			<div className="flex h-14 items-center px-4 lg:px-7">
				<div className="shrink-0 lg:w-[calc(var(--docs-rail)-1.75rem)]">
					{brand}
				</div>
				<div className="hidden min-w-0 pl-3 lg:block">
					<DocsTabs />
				</div>
				<div className="ml-auto hidden shrink-0 items-center gap-2 pl-6 lg:flex">
					{actions}
				</div>
				<div className="ml-auto flex items-center gap-1 lg:hidden">
					<SearchIconButton />
					<MoreMenu links={menuLinks} />
				</div>
			</div>
			<div className="flex h-11 items-center px-4 lg:hidden">
				<MobileNavigation />
			</div>
		</header>
	);
}

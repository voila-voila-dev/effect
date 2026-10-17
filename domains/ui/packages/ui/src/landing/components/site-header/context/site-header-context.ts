import { createContext } from "react";
import type { SiteHeaderCollapse } from "#/landing/components/site-header/lib/collapse-breakpoints.ts";

interface SiteHeaderContextValue {
	collapseBelow: SiteHeaderCollapse;
	open: boolean;
	setOpen: (open: boolean) => void;
	toggle: () => void;
}

function withoutMenu(): void {
	// Outside a SiteHeader.Root there is no menu to open or close.
}

/** Mobile-menu state and collapse breakpoint, set by `SiteHeader.Root`. */
export const SiteHeaderContext = createContext<SiteHeaderContextValue>({
	collapseBelow: "md",
	open: false,
	setOpen: withoutMenu,
	toggle: withoutMenu,
});

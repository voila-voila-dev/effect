import { useState } from "react";
import { SiteHeaderContext } from "#/landing/components/site-header/context/site-header-context.ts";
import {
	collapseBreakpoints,
	type SiteHeaderCollapse,
} from "#/landing/components/site-header/lib/collapse-breakpoints.ts";
import { useScrollLock } from "#/landing/hooks/use-scroll-lock.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"header"> {
	/**
	 * Whether the mobile menu starts open. Leave it off: the menu server-renders
	 * closed and hydrates, so opening by default flashes on first paint.
	 */
	defaultOpen?: boolean;
	/** Controlled open state — pair with `onOpenChange`. */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/**
	 * The width under which the burger menu replaces the desktop nav. A header
	 * with more links and buttons than `md` can hold collapses until `xl`
	 * instead of wrapping.
	 */
	collapseBelow?: SiteHeaderCollapse;
}

/**
 * Sticky marketing site header. Compose: Root > Bar (Brand + Nav > NavList >
 * NavItem… + Actions + MobileToggle) + MobileMenu > MobileNavItem… +
 * MobileActions. The mobile menu server-renders closed and hydrates.
 *
 * Below `collapseBelow` the menu is a full-screen overlay under the bar: the
 * nav list scrolls on its own while the page underneath is frozen (see
 * `useScrollLock`), and `MobileActions` pins its buttons to the bottom. The
 * controlled `open`/`onOpenChange` pair lets the menu be mutually exclusive
 * with other full-screen surfaces, such as a cart drawer.
 */
export function SiteHeaderRoot({
	defaultOpen = false,
	open: openProp,
	onOpenChange,
	collapseBelow = "md",
	className,
	...props
}: Props) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
	const isControlled = openProp !== undefined;
	const open = isControlled ? openProp : uncontrolledOpen;

	function setOpen(next: boolean) {
		if (!isControlled) setUncontrolledOpen(next);
		onOpenChange?.(next);
	}

	// The scope lets CSS release the lock past the breakpoint where the menu is
	// hidden, so no resize handling is needed here.
	useScrollLock(open, collapseBreakpoints[collapseBelow].scrollLock);

	return (
		<SiteHeaderContext.Provider
			value={{ collapseBelow, open, setOpen, toggle: () => setOpen(!open) }}
		>
			<header
				data-slot="site-header"
				className={cn(
					"sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg",
					className,
				)}
				{...props}
			/>
		</SiteHeaderContext.Provider>
	);
}

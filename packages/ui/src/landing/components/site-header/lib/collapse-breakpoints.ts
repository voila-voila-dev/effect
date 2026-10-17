import type { ScrollLockScope } from "#/landing/lib/scroll-lock-scope.ts";

/** The width under which the burger menu replaces the desktop nav. */
export type SiteHeaderCollapse = "md" | "xl";

/**
 * Literal class names per breakpoint, so Tailwind sees every one of them in
 * source — a `${breakpoint}:flex` template would never be emitted.
 */
export const collapseBreakpoints: Record<
	SiteHeaderCollapse,
	{ nav: string; mobileOnly: string; scrollLock: ScrollLockScope }
> = {
	md: { nav: "md:flex", mobileOnly: "md:hidden", scrollLock: "mobile" },
	xl: { nav: "xl:flex", mobileOnly: "xl:hidden", scrollLock: "below-xl" },
};

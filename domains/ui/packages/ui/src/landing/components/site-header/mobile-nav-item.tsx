import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { useContext } from "react";
import { SiteHeaderContext } from "#/landing/components/site-header/context/site-header-context.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends useRender.ComponentProps<"a"> {}

/**
 * A mobile-menu entry — the anchor comes wrapped in its own `li`. Following it
 * closes the menu, so the destination is not left hidden behind the overlay.
 */
export function SiteHeaderMobileNavItem({
	className,
	render,
	...props
}: Props) {
	const { setOpen } = useContext(SiteHeaderContext);
	const anchor = useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(
			{
				onClick: () => setOpen(false),
				className: cn(
					"block rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
					className,
				),
			},
			props,
		),
		render,
		state: {
			slot: "site-header-mobile-nav-item",
		},
	});

	return <li>{anchor}</li>;
}

import { useContext } from "react";
import { Container } from "#/landing/components/container.tsx";
import { SiteHeaderContext } from "#/landing/components/site-header/context/site-header-context.ts";
import { collapseBreakpoints } from "#/landing/components/site-header/lib/collapse-breakpoints.ts";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<"div"> {}

/**
 * Full-screen overlay pinned below the h-16 bar. Its height is viewport-based
 * rather than `bottom-0` because the bar's `backdrop-filter` makes the header
 * a containing block for fixed children.
 */
export function SiteHeaderMobileMenu({ className, children, ...props }: Props) {
	const { collapseBelow, open } = useContext(SiteHeaderContext);

	return (
		<div
			data-slot="site-header-mobile-menu"
			className={cn(
				"fixed inset-x-0 top-16 z-40 flex h-[calc(100dvh-4rem)] flex-col bg-background",
				collapseBreakpoints[collapseBelow].mobileOnly,
				!open && "hidden",
				className,
			)}
			{...props}
		>
			<Container className="flex min-h-0 flex-1 flex-col">
				<ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain py-4">
					{children}
				</ul>
			</Container>
		</div>
	);
}

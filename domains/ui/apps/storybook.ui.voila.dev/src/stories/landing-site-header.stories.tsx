import type { Meta, StoryObj } from "@storybook/tanstack-react";
import { Button } from "@voila.dev/ui/button";
import { SiteHeader } from "@voila.dev/ui/landing";
import { BrandLogo, mainNavigation } from "./landing-fixtures";

const meta = {
	title: "Landing/SiteHeader",
	component: SiteHeader.Root,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof SiteHeader.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

function HeaderExample({ collapseBelow }: { collapseBelow?: "md" | "xl" }) {
	return (
		<SiteHeader.Root collapseBelow={collapseBelow}>
			<SiteHeader.Bar>
				<SiteHeader.Brand href="/" aria-label="acme.dev">
					<BrandLogo />
				</SiteHeader.Brand>

				<SiteHeader.Nav>
					<SiteHeader.NavList>
						{mainNavigation.map((item) => (
							<SiteHeader.NavItem key={item.href} href={item.href}>
								{item.title}
							</SiteHeader.NavItem>
						))}
					</SiteHeader.NavList>
					<SiteHeader.Actions>
						<Button size="sm" variant="brand">
							I'm a freelancer
						</Button>
						<Button size="sm" variant="highlight">
							I'm a client
						</Button>
					</SiteHeader.Actions>
				</SiteHeader.Nav>

				<SiteHeader.MobileToggle aria-label="Open or close the menu" />
			</SiteHeader.Bar>

			<SiteHeader.MobileMenu>
				{mainNavigation.map((item) => (
					<SiteHeader.MobileNavItem key={item.href} href={item.href}>
						{item.title}
					</SiteHeader.MobileNavItem>
				))}
				<SiteHeader.MobileActions>
					<Button variant="brand" className="w-full">
						I'm a freelancer
					</Button>
					<Button variant="highlight" className="w-full">
						I'm a client
					</Button>
				</SiteHeader.MobileActions>
			</SiteHeader.MobileMenu>
		</SiteHeader.Root>
	);
}

/** Reproduces the original Astro site's `layout/header.astro`. Resize below `md` to use the burger menu. */
export const Default: Story = {
	render: () => (
		<div className="min-h-75">
			<HeaderExample />
			<div className="p-8 text-sm text-muted-foreground">
				Page content — the header stays pinned to the top with a backdrop blur.
			</div>
		</div>
	),
};

/**
 * The burger menu stays until `xl`, for a header with more than a tablet can
 * hold. Open it: the page behind is frozen until it closes or the viewport
 * passes `xl`.
 */
export const CollapseBelowXl: Story = {
	render: () => (
		<div className="min-h-[150vh]">
			<HeaderExample collapseBelow="xl" />
			<div className="p-8 text-sm text-muted-foreground">
				Resize between `md` and `xl`: the burger is still there.
			</div>
		</div>
	),
};

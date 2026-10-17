import { GithubLogoIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Button } from "@voila.dev/ui/button";
import { SearchButton } from "@voila.dev/ui-docs/components/search/docs-search";

import { PaletteSelect } from "../palette-select.tsx";
import { ThemeToggle } from "../theme-toggle.tsx";
import { Wordmark } from "../wordmark.tsx";

/** The home page's bar: the docs' search, their first page, and the same theme and palette switches. */
export function HomeHeader() {
	return (
		<header className="sticky top-0 z-40 border-border border-b bg-background/80 backdrop-blur">
			<div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
				<Wordmark />
				<div className="ml-auto flex items-center gap-2">
					<div className="hidden w-56 sm:block">
						<SearchButton />
					</div>
					<Button
						variant="ghost"
						size="sm"
						nativeButton={false}
						render={<Link to={"/start/introduction" as string} />}
					>
						Docs
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="hidden md:inline-flex"
						nativeButton={false}
						render={<a href="https://storybook.ui.voila.dev" />}
					>
						Storybook
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="GitHub repository"
						nativeButton={false}
						render={
							<a href="https://github.com/voila-voila-dev/platform/tree/main/domains/ui/packages/ui" />
						}
					>
						<GithubLogoIcon />
					</Button>
					<PaletteSelect />
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}

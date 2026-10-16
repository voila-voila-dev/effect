import { CaretRightIcon, ListIcon } from "@phosphor-icons/react";
import { lazy, Suspense, useState } from "react";
import { useDocs } from "./docs-provider.tsx";

function loadDrawer() {
	return import("./mobile-navigation-drawer.tsx");
}

const MobileNavigationDrawer = lazy(() =>
	loadDrawer().then(({ MobileNavigationDrawer: loadedDrawer }) => ({
		default: loadedDrawer,
	})),
);

/** The phone's second header bar: where the reader is, and the sidebar as a drawer that loads on first use. */
export function MobileNavigation() {
	const [open, setOpen] = useState(false);
	const [requested, setRequested] = useState(false);
	const { navigation, messages } = useDocs();
	const { location } = navigation;
	return (
		<>
			<button
				type="button"
				aria-haspopup="dialog"
				aria-expanded={open}
				onPointerEnter={loadDrawer}
				onFocus={loadDrawer}
				onClick={() => {
					setRequested(true);
					setOpen(true);
				}}
				className="-ml-1 flex min-w-0 items-center gap-3 rounded-lg py-1 pr-2 pl-1 text-docs-sm text-muted-foreground hover:text-foreground"
			>
				<ListIcon className="size-5 shrink-0" aria-hidden />
				<span className="sr-only">{messages.menu}</span>
				{location ? (
					<span className="flex min-w-0 items-center gap-2">
						<span className="shrink-0">{location.group.label}</span>
						<CaretRightIcon className="size-3 shrink-0" aria-hidden />
						<span className="truncate text-foreground">
							{location.item.sidebarTitle ?? location.item.title}
						</span>
					</span>
				) : null}
			</button>
			{requested ? (
				<Suspense fallback={null}>
					<MobileNavigationDrawer open={open} onOpenChange={setOpen} />
				</Suspense>
			) : null}
		</>
	);
}

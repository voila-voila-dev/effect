import { Dialog } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react";
import { useDocs } from "./docs-provider.tsx";
import { DocsSidebar } from "./docs-sidebar.tsx";
import { DocsTabs } from "./docs-tabs.tsx";
import { ThemeSwitcher } from "./docs-theme.tsx";

export function MobileNavigationDrawer({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { navigation, messages } = useDocs();
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
				<Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-docs-canvas shadow-xl outline-none transition-transform duration-200 data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full">
					<div className="flex h-14 items-center justify-between px-4">
						<Dialog.Title className="pl-4 font-semibold text-docs-sm">
							{messages.title}
						</Dialog.Title>
						<Dialog.Close
							aria-label={messages.menuClose}
							className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
						>
							<XIcon className="size-4" aria-hidden />
						</Dialog.Close>
					</div>
					{navigation.tabs.length > 1 ? (
						<div className="border-border border-b px-6 pb-4">
							<DocsTabs onNavigate={() => onOpenChange(false)} />
						</div>
					) : null}
					<div className="flex-1 overflow-y-auto px-2 pt-4 pb-6">
						<DocsSidebar onNavigate={() => onOpenChange(false)} />
					</div>
					<div className="mx-4 border-border border-t py-3">
						<ThemeSwitcher />
					</div>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

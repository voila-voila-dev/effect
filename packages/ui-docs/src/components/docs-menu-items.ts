import type { Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export const DOCS_MENU_TRIGGER_CLASS =
	"flex items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground data-[popup-open]:bg-foreground/5 data-[popup-open]:text-foreground";

export type DocsMenuItem = {
	icon?: Icon;
	title: string;
	description?: string;
} & ({ href: string } | { onClick: () => void });

export interface DocsMenuProps {
	trigger: ReactNode;
	label: string;
	triggerClassName?: string;
	items: ReadonlyArray<DocsMenuItem>;
}

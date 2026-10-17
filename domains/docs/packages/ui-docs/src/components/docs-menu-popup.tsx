import { Menu } from "@base-ui/react/menu";
import { cn } from "../lib/cn.ts";

import { DocsLink } from "./docs-link.tsx";
import {
	DOCS_MENU_TRIGGER_CLASS,
	type DocsMenuItem,
	type DocsMenuProps,
} from "./docs-menu-items.ts";

const ITEM_CLASS =
	"flex cursor-default items-start gap-3 rounded-lg px-2.5 py-2 text-docs-sm text-foreground outline-none select-none focus-visible:outline-none data-[highlighted]:bg-foreground/5";

function ItemBody({ icon: ItemIcon, title, description }: DocsMenuItem) {
	return (
		<>
			{ItemIcon ? (
				<ItemIcon
					className="mt-0.5 size-4 shrink-0 text-muted-foreground"
					aria-hidden
				/>
			) : null}
			<span className="min-w-0">
				<span className="block font-medium">{title}</span>
				{description ? (
					<span className="block text-muted-foreground text-xs">
						{description}
					</span>
				) : null}
			</span>
		</>
	);
}

function Item({ item }: { item: DocsMenuItem }) {
	return "href" in item ? (
		<Menu.LinkItem
			render={<DocsLink href={item.href} />}
			className={ITEM_CLASS}
		>
			<ItemBody {...item} />
		</Menu.LinkItem>
	) : (
		<Menu.Item onClick={item.onClick} className={ITEM_CLASS}>
			<ItemBody {...item} />
		</Menu.Item>
	);
}

/** The menu itself, swapped in open for the placeholder trigger the reader clicked. */
export function LoadedDocsMenu({
	trigger,
	label,
	triggerClassName,
	items,
}: DocsMenuProps) {
	return (
		<Menu.Root defaultOpen>
			<Menu.Trigger
				aria-label={label}
				className={cn(DOCS_MENU_TRIGGER_CLASS, triggerClassName)}
			>
				{trigger}
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Positioner sideOffset={6} align="end" className="z-50">
					<Menu.Popup className="min-w-60 origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition duration-150 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
						{items.map((item) => (
							<Item key={item.title} item={item} />
						))}
					</Menu.Popup>
				</Menu.Positioner>
			</Menu.Portal>
		</Menu.Root>
	);
}

import { useState } from "react";
import { cn } from "../lib/cn.ts";

import {
	DOCS_MENU_TRIGGER_CLASS,
	type DocsMenuProps,
} from "./docs-menu-items.ts";
import type { LoadedDocsMenu } from "./docs-menu-popup.tsx";

function loadMenu() {
	return import("./docs-menu-popup.tsx");
}

/**
 * The one dropdown of the docs: the page actions and the mobile header links.
 * Most readers never open it, so a plain button stands in for its trigger: the
 * menu and its positioning engine load when the reader points at or focuses
 * it, and take over, open, on the first click.
 */
export function DocsMenu(props: DocsMenuProps) {
	const [Menu, setMenu] = useState<typeof LoadedDocsMenu>();

	if (Menu) {
		return <Menu {...props} />;
	}
	return (
		<button
			type="button"
			aria-label={props.label}
			aria-haspopup="menu"
			className={cn(DOCS_MENU_TRIGGER_CLASS, props.triggerClassName)}
			onPointerEnter={loadMenu}
			onFocus={loadMenu}
			onClick={() =>
				loadMenu().then(({ LoadedDocsMenu: loadedMenu }) =>
					setMenu(() => loadedMenu),
				)
			}
		>
			{props.trigger}
		</button>
	);
}

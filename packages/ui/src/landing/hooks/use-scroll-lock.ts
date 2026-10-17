import { useEffect } from "react";
import type { ScrollLockScope } from "#/landing/lib/scroll-lock-scope.ts";

/**
 * Freezes page scroll while `locked` is true by flagging the document element;
 * `@voila.dev/ui/styles/landing.css` turns the `data-scroll-locked` flag into
 * `overflow: hidden`, and releases the narrower scopes past their breakpoint.
 *
 * Locking the viewport is a side effect on a node outside the React tree, so it
 * belongs in an effect — keeping it in one hook means every full-screen
 * surface (menu, cart, …) shares the same behaviour instead of juggling
 * `document.body.style`. A nested lock restores the outer scope on release.
 */
export function useScrollLock(locked: boolean, scope: ScrollLockScope = "all") {
	useEffect(() => {
		if (!locked) return;
		const root = document.documentElement;
		const previous = root.getAttribute("data-scroll-locked");
		root.setAttribute("data-scroll-locked", scope);
		return () => {
			if (previous === null) root.removeAttribute("data-scroll-locked");
			else root.setAttribute("data-scroll-locked", previous);
		};
	}, [locked, scope]);
}

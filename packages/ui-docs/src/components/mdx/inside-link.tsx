import { createContext, useContext } from "react";

/**
 * True under a block that is itself a link (a card with an `href`). An `<a>`
 * there is invalid HTML: the parser closes the outer link before it, so the
 * prerendered page no longer matches what React hydrates (error #418).
 */
export const InsideLink = createContext(false);

export function useInsideLink(): boolean {
	return useContext(InsideLink);
}

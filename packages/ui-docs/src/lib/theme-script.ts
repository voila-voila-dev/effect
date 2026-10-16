// Its own dependency-free module: a route's head imports it, and whatever it
// imports lands in the chunk every page of the host loads.

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Runs in the docs' <head> before the first paint, so a reader who chose the
 * dark theme never sees the light one flash. Only the docs set the class: the
 * rest of the host stays light.
 */
export function themeScript(storageKey: string): string {
	return `try{var t=localStorage.getItem(${JSON.stringify(storageKey)});document.documentElement.classList.toggle("dark",t==="dark"||(t!=="light"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches))}catch(e){}`;
}

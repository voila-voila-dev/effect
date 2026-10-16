import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

/** What the reader chose while storage is blocked: kept until the page reloads. */
const unstored = new Map<string, string>();

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	window.addEventListener("storage", listener);
	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", listener);
	};
}

function read(key: string): string | undefined {
	try {
		return window.localStorage.getItem(key) ?? undefined;
	} catch {
		return unstored.get(key);
	}
}

/**
 * A per-reader choice kept in localStorage. The server and the first client
 * render see none, so the prerendered HTML hydrates without a mismatch.
 */
export function useStoredChoice(
	key: string,
): [string | undefined, (value: string) => void] {
	const value = useSyncExternalStore(
		subscribe,
		() => read(key),
		() => undefined,
	);
	function choose(next: string) {
		try {
			window.localStorage.setItem(key, next);
		} catch {
			unstored.set(key, next);
		}
		for (const listener of listeners) {
			listener();
		}
	}
	return [value, choose];
}

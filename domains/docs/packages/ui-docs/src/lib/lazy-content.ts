import { type ComponentType, type LazyExoticComponent, lazy } from "react";

/** A page body that loads on its own, and that a loader can load ahead of the render. */
export interface LazyContent<Props extends object> {
	Content: LazyExoticComponent<ComponentType<Props>>;
	/** Loads the body, so the next render of `Content` does not suspend. */
	preloadContent: () => Promise<void>;
}

/** A thenable React.lazy reads in the same tick, so a preloaded body renders without suspending. */
function settled<T>(value: T): Promise<T> {
	// biome-ignore lint/suspicious/noThenProperty: React.lazy only calls then
	return { then: (resolve: (value: T) => void) => resolve(value) } as never;
}

/**
 * A page's compiled body (`() => import("./page.mdx")`) as a lazy component.
 * A route's loader awaits `preloadContent`, so a prerendered page hydrates
 * with its body already there instead of swapping it for the Suspense
 * fallback and back; a page reached without a loader still suspends.
 */
export function lazyContent<Props extends object>(
	load: () => Promise<ComponentType<Props>>,
): LazyContent<Props> {
	let loaded: { default: ComponentType<Props> } | undefined;
	async function preloadContent() {
		loaded = { default: await load() };
	}
	const Content = lazy(() =>
		loaded ? settled(loaded) : load().then((content) => ({ default: content })),
	);
	return { Content, preloadContent };
}

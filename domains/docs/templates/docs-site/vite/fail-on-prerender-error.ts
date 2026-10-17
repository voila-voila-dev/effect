import type { Plugin } from "vite";

/** What `renderRouterToStream` prefixes every render error it swallows with. */
const RENDER_ERROR = /Error in render(?:ToReadableStream|ToPipeableStream):/u;

function describe(value: unknown): string {
	if (value instanceof Error) {
		return `${value.message}\n${value.stack ?? ""}`;
	}
	return typeof value === "string" ? value : "";
}

/**
 * Fails the build when a page renders with an error. `prerender.failOnError`
 * only covers a route that throws or answers non-2xx: an error inside the
 * React render is handed to `onError`, the subtree is dropped, the response
 * is still 200 and the page is written to disk with a hole in it. The router
 * reports it through `console.error` and exposes no hook, so this listens
 * there, and delivers the verdict on the way out (the crawl runs after every
 * build hook).
 */
export function failOnPrerenderError(): Plugin {
	const failures = new Set<string>();
	return {
		name: "docs-site:fail-on-prerender-error",
		apply: "build",
		enforce: "post",
		buildStart() {
			const error = console.error;
			console.error = (...args: Array<unknown>) => {
				const joined = args.map(describe).join("\n");
				if (RENDER_ERROR.test(joined)) {
					failures.add(joined.split("\n").slice(0, 2).join(" "));
				}
				error(...args);
			};
			process.on("exit", () => {
				if (failures.size === 0) {
					return;
				}
				error(
					`\n${failures.size} page(s) rendered with an error and were written anyway:\n${[
						...failures,
					]
						.map((failure) => `  ${failure}`)
						.join("\n")}\n`,
				);
				process.exitCode = 1;
			});
		},
	};
}

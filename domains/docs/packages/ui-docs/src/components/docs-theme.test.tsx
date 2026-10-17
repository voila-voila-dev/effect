import { afterEach, beforeEach, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { DocsThemeProvider } from "./docs-theme.tsx";

const STORAGE_KEY = "test:theme";

beforeEach(() => {
	localStorage.setItem(STORAGE_KEY, "dark");
});

afterEach(() => {
	cleanup();
	localStorage.removeItem(STORAGE_KEY);
	document.documentElement.classList.remove("dark");
});

it("applies the stored theme, and hands the page back light when the docs unmount", () => {
	const { unmount } = render(
		<DocsThemeProvider storageKey={STORAGE_KEY}>docs</DocsThemeProvider>,
	);
	expect(document.documentElement.classList.contains("dark")).toBe(true);
	unmount();
	expect(document.documentElement.classList.contains("dark")).toBe(false);
});

it("keeps the theme on the page when it is the whole site's", () => {
	const { unmount } = render(
		<DocsThemeProvider storageKey={STORAGE_KEY} scope="site">
			docs
		</DocsThemeProvider>,
	);
	unmount();
	expect(document.documentElement.classList.contains("dark")).toBe(true);
});

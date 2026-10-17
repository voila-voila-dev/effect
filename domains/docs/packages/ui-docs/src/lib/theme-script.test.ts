import { describe, expect, it } from "bun:test";

import { themeScript } from "./theme-script.ts";

describe("themeScript", () => {
	it("reads the host's storage key before the first paint", () => {
		const script = themeScript("site:docs-theme");

		expect(script).toContain('localStorage.getItem("site:docs-theme")');
		expect(script).toContain('matchMedia("(prefers-color-scheme: dark)")');
	});
});

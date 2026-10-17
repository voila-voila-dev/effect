// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useScrollLock } from "#/landing/hooks/use-scroll-lock.ts";
import type { ScrollLockScope } from "#/landing/lib/scroll-lock-scope.ts";

afterEach(cleanup);

function Lock({ locked, scope }: { locked: boolean; scope?: ScrollLockScope }) {
	useScrollLock(locked, scope);
	return null;
}

function flag() {
	return document.documentElement.getAttribute("data-scroll-locked");
}

describe("useScrollLock", () => {
	it("flags the document only while locked and cleans up on unmount", () => {
		const screen = render(<Lock locked={true} />);
		expect(flag()).toBe("all");

		screen.rerender(<Lock locked={false} />);
		expect(flag()).toBe(null);

		screen.rerender(<Lock locked={true} scope="mobile" />);
		expect(flag()).toBe("mobile");

		screen.unmount();
		expect(flag()).toBe(null);
	});

	it("does not flag the document when it starts unlocked", () => {
		render(<Lock locked={false} />);
		expect(flag()).toBe(null);
	});

	it("restores the outer lock when a nested one releases", () => {
		const outer = render(<Lock locked={true} scope="all" />);
		const inner = render(<Lock locked={true} scope="mobile" />);
		expect(flag()).toBe("mobile");
		inner.unmount();
		expect(flag()).toBe("all");
		outer.unmount();
		expect(flag()).toBe(null);
	});
});

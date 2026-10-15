import { describe, expect, it } from "bun:test";
import { ratchet } from "./ratchet.ts";

describe("ratchet", () => {
	it("passes when the offenders are the baseline", () => {
		expect(ratchet(["a.ts"], ["a.ts"])).toStrictEqual({ added: [], fixed: [] });
	});

	it("fails on a new offender and on a fixed entry left in the baseline", () => {
		expect(ratchet(["a.ts", "b.ts"], ["b.ts", "c.ts"])).toStrictEqual({
			added: ["c.ts"],
			fixed: ["a.ts"],
		});
	});
});

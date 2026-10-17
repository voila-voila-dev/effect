import { describe, expect, it } from "bun:test";
import {
	parseEnvironment,
	parseLine,
	parseValue,
} from "./parse-environment.ts";

describe("parseEnvironment", () => {
	it("reads keys, quotes, comments and export prefixes", () => {
		expect(
			parseEnvironment(
				[
					"# a comment",
					"",
					"PLAIN=value",
					'DOUBLE="two words"',
					"SINGLE='it''s \\n literal'",
					'ESCAPED="line\\nbreak"',
					"export EXPORTED=yes",
					"TRAILING=kept # dropped",
					"HASH=pa#ss",
					"EMPTY=",
					"NO_SEPARATOR",
					"WINDOWS=crlf\r",
				].join("\n"),
			),
		).toStrictEqual({
			PLAIN: "value",
			DOUBLE: "two words",
			SINGLE: "it''s \\n literal",
			ESCAPED: "line\nbreak",
			EXPORTED: "yes",
			TRAILING: "kept",
			HASH: "pa#ss",
			EMPTY: "",
			WINDOWS: "crlf",
		});
	});
});

describe("parseLine", () => {
	it("skips what is not an assignment", () => {
		expect(parseLine("")).toBeNull();
		expect(parseLine("# KEY=value")).toBeNull();
		expect(parseLine("=value")).toBeNull();
		expect(parseLine("KEY")).toBeNull();
		expect(parseLine("  KEY = value  ")).toStrictEqual(["KEY", "value"]);
	});
});

describe("parseValue", () => {
	it("reads quotes and comments as a shell would", () => {
		expect(parseValue('"a\\nb"')).toBe("a\nb");
		expect(parseValue("'a\\nb'")).toBe("a\\nb");
		expect(parseValue("value # comment")).toBe("value");
		expect(parseValue('"')).toBe('"');
	});
});

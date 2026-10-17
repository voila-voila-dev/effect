import { describe, expect, it } from "bun:test";
import { tokenize } from "./highlight.ts";
describe("tokenize", () => {
    it("tells JSON keys from string values", () => {
        expect(tokenize('{"id": "a", "n": 1, "ok": null}', "json")).toMatchObject([
            { kind: "punctuation", text: "{" },
            { kind: "key", text: '"id"' },
            { kind: "punctuation", text: ":" },
            { kind: "plain", text: " " },
            { kind: "string", text: '"a"' },
            { kind: "punctuation", text: "," },
            { kind: "plain", text: " " },
            { kind: "key", text: '"n"' },
            { kind: "punctuation", text: ":" },
            { kind: "plain", text: " " },
            { kind: "number", text: "1" },
            { kind: "punctuation", text: "," },
            { kind: "plain", text: " " },
            { kind: "key", text: '"ok"' },
            { kind: "punctuation", text: ":" },
            { kind: "plain", text: " " },
            { kind: "literal", text: "null" },
            { kind: "punctuation", text: "}" },
        ]);
    });
    it("colors the command, its flags and quoted values", () => {
        expect(tokenize("curl --request POST \\\n  --url 'https://x'", "shell").map((token) => token.kind)).toEqual(["command", "plain", "flag", "plain", "flag", "plain", "string"]);
    });
    it("keeps every character", () => {
        const code = '{\n  "a": [1, "b\\"c"]\n}';
        expect(tokenize(code, "json")
            .map((token) => token.text)
            .join("")).toBe(code);
    });
    it("colors a fetch call", () => {
        expect(tokenize('const r = await fetch("u", { method: "GET" });', "javascript")
            .filter((token) => token.kind !== "plain" && token.kind !== "punctuation")
            .map((token) => [token.kind, token.text])).toEqual([
            ["keyword", "const"],
            ["keyword", "await"],
            ["function", "fetch"],
            ["string", '"u"'],
            ["key", "method"],
            ["string", '"GET"'],
        ]);
    });
});

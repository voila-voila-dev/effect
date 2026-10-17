import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const mdxDirectory = import.meta.dir;
describe("the MDX pipeline", () => {
    it("imports with relative paths only, because Node 22 loads it from vite.config.ts and refuses `#/` specifiers", () => {
        const hashImports = readdirSync(mdxDirectory)
            .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
            .filter((file) => /from\s+["']#/u.test(readFileSync(join(mdxDirectory, file), "utf8")));
        expect(hashImports).toEqual([]);
    });
});

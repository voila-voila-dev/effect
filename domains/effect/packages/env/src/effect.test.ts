import { describe, expect, it } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Config, Effect } from "effect";
import { environmentFilesLayer } from "./effect.ts";

describe("environmentFilesLayer", () => {
	it("feeds Config from the files, under the real environment", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "voila-env-")), ".env");
		writeFileSync(path, "PORT=3000\nHOST=file.example");

		const program = Effect.all([Config.Number("PORT"), Config.String("HOST")]);

		const values = await Effect.runPromise(
			program.pipe(
				Effect.provide(
					environmentFilesLayer([path], { env: { HOST: "env.example" } }),
				),
			),
		);
		expect(values).toStrictEqual([3000, "env.example"]);
	});
});

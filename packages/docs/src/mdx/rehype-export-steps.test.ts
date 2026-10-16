import { describe, expect, it } from "bun:test";
import { evaluate } from "@mdx-js/mdx";

import { rehypeExportSteps } from "./rehype-export-steps.ts";

// The body is never rendered: the exports are all the test reads, so the package stays framework-free.
const runtime = {
	Fragment: Symbol("Fragment"),
	jsx: () => null,
	jsxs: () => null,
};

async function stepsOf(source: string) {
	const module = await evaluate(source, {
		...runtime,
		rehypePlugins: [rehypeExportSteps],
	});
	return module.steps;
}

describe("rehypeExportSteps", () => {
	it("exports the titled steps of the first Steps, with their text", async () => {
		const steps = await stepsOf(`
Intro.

<Steps>
  <Step title="Open the workspace">
    Go to **app.example.com**.
  </Step>
  <Step title="Sign">
    Enter the code you got by text message.
  </Step>
</Steps>

<Steps>
  <Step title="Another procedure">Later.</Step>
</Steps>
`);
		expect(steps).toEqual([
			{ name: "Open the workspace", text: "Go to app.example.com." },
			{ name: "Sign", text: "Enter the code you got by text message." },
		]);
	});

	it("exports no steps from a page without Steps", async () => {
		expect(await stepsOf("# Title\n\nA paragraph.")).toEqual([]);
	});
});

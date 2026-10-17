import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";

import { TestDocsProvider } from "../docs-provider.test-helper.tsx";
import { Screenshot, type ScreenshotProps } from "./screenshot.tsx";

afterEach(cleanup);

const shot: ScreenshotProps = {
	src: "/assets/projects.webp",
	width: 1600,
	height: 1800,
	alt: "The team's projects",
};

function renderShot(props: Partial<ScreenshotProps> = {}) {
	return render(
		<TestDocsProvider tabs={[]} pathname="/docs">
			<Screenshot {...shot} {...props} />
		</TestDocsProvider>,
	);
}

describe("Screenshot", () => {
	it("reserves the image's space and loads it lazily", () => {
		const image = renderShot().getByAltText("The team's projects");

		expect(image.getAttribute("width")).toBe("1600");
		expect(image.getAttribute("height")).toBe("1800");
		expect(image.getAttribute("loading")).toBe("lazy");
	});

	it("shows the address in a browser frame", () => {
		const view = renderShot({ url: "app.example.com/projects" });

		expect(view.getByText("app.example.com/projects")).toBeTruthy();
	});

	it("draws no address bar around a phone capture", () => {
		const view = renderShot({
			frame: "phone",
			url: "app.example.com/projects",
		});

		expect(view.queryByText("app.example.com/projects")).toBeNull();
	});

	it("puts the caption under the image", () => {
		const view = renderShot({ caption: "Every project" });

		expect(view.getByText("Every project").tagName).toBe("FIGCAPTION");
	});

	it("opens the full-size image from a labelled button", async () => {
		const view = renderShot();
		fireEvent.click(view.getByRole("button", { name: "screenshotZoom" }));

		await waitFor(() =>
			expect(view.getAllByAltText("The team's projects")).toHaveLength(2),
		);
	});
});

// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Chat } from "#/chat/index.ts";

afterEach(cleanup);

describe("Chat.Widget", () => {
	it("composes a header, a heading and a full-width action", () => {
		const { baseElement } = render(
			<Chat.Widget>
				<Chat.WidgetHeader>
					<Chat.WidgetIcon>
						<svg aria-hidden="true" />
					</Chat.WidgetIcon>
					<Chat.WidgetHeading>
						<Chat.WidgetTitle>INV-2026-00004</Chat.WidgetTitle>
						<Chat.WidgetDetail>Issued Sep 14, 2026</Chat.WidgetDetail>
					</Chat.WidgetHeading>
				</Chat.WidgetHeader>
				<Chat.WidgetAction>
					<button type="button">Download</button>
				</Chat.WidgetAction>
			</Chat.Widget>,
		);

		const root = baseElement.querySelector("[data-slot=chat-widget]");
		expect(root?.className).toContain("max-w-[85%]");
		expect(screen.getByText("INV-2026-00004").getAttribute("data-slot")).toBe(
			"chat-widget-title",
		);
		expect(
			screen.getByText("Issued Sep 14, 2026").getAttribute("data-slot"),
		).toBe("chat-widget-detail");
		const action = baseElement.querySelector("[data-slot=chat-widget-action]");
		expect(action?.className).toContain("[&>*]:w-full");
		expect(action?.querySelector("button")?.textContent).toBe("Download");
	});

	it("keeps the icon out of the accessibility tree", () => {
		const { baseElement } = render(
			<Chat.Widget>
				<Chat.WidgetHeader>
					<Chat.WidgetIcon>
						<svg />
					</Chat.WidgetIcon>
				</Chat.WidgetHeader>
			</Chat.Widget>,
		);
		expect(
			baseElement
				.querySelector("[data-slot=chat-widget-icon]")
				?.getAttribute("aria-hidden"),
		).toBe("true");
	});

	it("renders as another element through render", () => {
		const { baseElement } = render(
			<Chat.Widget render={<section />}>
				<Chat.WidgetTitle>Order</Chat.WidgetTitle>
			</Chat.Widget>,
		);
		expect(baseElement.querySelector("section")?.dataset.slot).toBe(
			"chat-widget",
		);
	});
});

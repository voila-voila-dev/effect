import type * as React from "react";
import { ComparisonPanel } from "#/landing/components/comparison-section/panel.tsx";
import { ComparisonPanelItem } from "#/landing/components/comparison-section/panel-item.tsx";
import { ComparisonPanelList } from "#/landing/components/comparison-section/panel-list.tsx";
import { ComparisonPanelTitle } from "#/landing/components/comparison-section/panel-title.tsx";
import { ComparisonPanels } from "#/landing/components/comparison-section/panels.tsx";

/** Seconds between two items fading in, and before the second panel starts. */
const ITEM_STAGGER = 0.08;
const SECOND_PANEL_DELAY = 0.3;

interface Props extends React.ComponentProps<typeof ComparisonPanels> {
	withoutTitle: React.ReactNode;
	withoutItems: readonly string[];
	withTitle: React.ReactNode;
	withItems: readonly string[];
}

/**
 * The whole "without" / "with" pair from four copy fields, staggered so the
 * second panel and its items fade in after the first — the shape most
 * comparisons need, without composing `Panels > Panel > PanelTitle +
 * PanelList > PanelItem` by hand. Compose the parts directly for anything
 * richer than a list of strings.
 */
export function ComparisonBeforeAfter({
	withoutTitle,
	withoutItems,
	withTitle,
	withItems,
	...props
}: Props) {
	return (
		<ComparisonPanels data-slot="comparison-before-after" {...props}>
			<ComparisonPanel variant="without">
				<ComparisonPanelTitle>{withoutTitle}</ComparisonPanelTitle>
				<ComparisonPanelList>
					{withoutItems.map((item, index) => (
						<ComparisonPanelItem
							key={`${index}-${item}`}
							style={{ animationDelay: `${index * ITEM_STAGGER}s` }}
						>
							{item}
						</ComparisonPanelItem>
					))}
				</ComparisonPanelList>
			</ComparisonPanel>

			<ComparisonPanel
				variant="with"
				style={{ animationDelay: `${SECOND_PANEL_DELAY}s` }}
			>
				<ComparisonPanelTitle>{withTitle}</ComparisonPanelTitle>
				<ComparisonPanelList>
					{withItems.map((item, index) => (
						<ComparisonPanelItem
							key={`${index}-${item}`}
							style={{
								animationDelay: `${SECOND_PANEL_DELAY + index * ITEM_STAGGER}s`,
							}}
						>
							{item}
						</ComparisonPanelItem>
					))}
				</ComparisonPanelList>
			</ComparisonPanel>
		</ComparisonPanels>
	);
}

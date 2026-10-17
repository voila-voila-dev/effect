import { ComparisonBeforeAfter } from "#/landing/components/comparison-section/before-after.tsx";
import { ComparisonContent } from "#/landing/components/comparison-section/content.tsx";
import { ComparisonMedia } from "#/landing/components/comparison-section/media.tsx";
import { ComparisonPanel } from "#/landing/components/comparison-section/panel.tsx";
import { ComparisonPanelItem } from "#/landing/components/comparison-section/panel-item.tsx";
import { ComparisonPanelList } from "#/landing/components/comparison-section/panel-list.tsx";
import { ComparisonPanelTitle } from "#/landing/components/comparison-section/panel-title.tsx";
import { ComparisonPanels } from "#/landing/components/comparison-section/panels.tsx";
import { ComparisonSectionRoot } from "#/landing/components/comparison-section/root.tsx";
import { ComparisonTag } from "#/landing/components/comparison-section/tag.tsx";
import { ComparisonTagList } from "#/landing/components/comparison-section/tag-list.tsx";

/**
 * Compose: `Root (tone) > Content (Eyebrow, Heading, Panels > Panel >
 * PanelTitle + PanelList > PanelItem, TagList > Tag) + Media`. `BeforeAfter`
 * builds the whole `Panels` pair from four copy fields.
 */
export const ComparisonSection = {
	Root: ComparisonSectionRoot,
	Content: ComparisonContent,
	Panels: ComparisonPanels,
	Panel: ComparisonPanel,
	PanelTitle: ComparisonPanelTitle,
	PanelList: ComparisonPanelList,
	PanelItem: ComparisonPanelItem,
	BeforeAfter: ComparisonBeforeAfter,
	TagList: ComparisonTagList,
	Tag: ComparisonTag,
	Media: ComparisonMedia,
};

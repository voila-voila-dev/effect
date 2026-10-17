import { useDocsGuide } from "../docs-guide.tsx";
import { useDocs } from "../docs-provider.tsx";
import { CardGroup, PageCard } from "../mdx/card.tsx";

/** The cards that close a page: its `next` pages, then the next step of the path the reader follows. */
export function NextSteps() {
	const { messages } = useDocs();
	const { next, place } = useDocsGuide();
	const pathNext = place?.path.steps[place.index + 1];
	const cards = [
		...next,
		...(pathNext &&
		!next.some((page) => page.href === pathNext.href.split("?")[0])
			? [pathNext]
			: []),
	];
	if (cards.length === 0) {
		return null;
	}
	return (
		<section className="mt-16">
			<h2 className="mb-4 font-semibold text-foreground text-lg">
				{messages.guide.nextStepsTitle}
			</h2>
			<CardGroup cols={cards.length > 2 ? 3 : 2}>
				{cards.map((page) => (
					<PageCard key={page.href} page={page} />
				))}
			</CardGroup>
		</section>
	);
}

import { contextMismatches } from "@voila.dev/docs/reader-context";

import { Chip } from "../chip.tsx";
import {
	type DocsAudienceIndexView,
	type DocsPathView,
	type DocsPlannedPathView,
	useDocsGuide,
} from "../docs-guide.tsx";
import { useDocs } from "../docs-provider.tsx";
import { ReaderContextPicker, useReaderContext } from "../reader-context.tsx";
import { Card, CardGroup, PageCard } from "./card.tsx";

/** A path card with the contexts it is written for, dimmed with its reason when the reader's is another. */
function PathCard({ path }: { path: DocsPathView }) {
	const { messages, readerContext } = useDocs();
	const { reasonFor, restrictionLabel, restrictionsOf } = useReaderContext();
	const reason = reasonFor(path.href);
	const appliesTo = readerContext.applicability[path.href];
	const length = messages.guide.pathLength(path.steps.length);
	return (
		<div className={reason ? "opacity-55" : undefined}>
			<Card title={path.title} href={path.href}>
				{reason ??
					(appliesTo
						? `${length} · ${restrictionLabel(restrictionsOf(appliesTo))}`
						: length)}
			</Card>
		</div>
	);
}

function PlannedPathCard({ path }: { path: DocsPlannedPathView }) {
	const { messages } = useDocs();
	const { restrictionLabel, restrictionsOf } = useReaderContext();
	return (
		<Card title={path.title}>
			<Chip className="mb-2">{messages.guide.plannedLabel}</Chip>
			{path.appliesTo ? (
				<span className="block font-medium text-xs">
					{restrictionLabel(restrictionsOf(path.appliesTo))}
				</span>
			) : null}
			<span className="block">{path.description}</span>
		</Card>
	);
}

/** The paths, then those announced for the reader's context. */
function PathCards({
	paths,
	planned,
}: Pick<DocsAudienceIndexView, "paths" | "planned">) {
	const { messages } = useDocs();
	const { context } = useReaderContext();
	const announced = planned.filter(
		(path) => contextMismatches(path.appliesTo, context).length === 0,
	);
	if (paths.length === 0 && announced.length === 0) {
		return null;
	}
	return (
		<section className="docs-flow">
			<h2>{messages.guide.pathsTitle}</h2>
			<CardGroup cols={2}>
				{paths.map((path) => (
					<PathCard key={path.id} path={path} />
				))}
				{announced.map((path) => (
					<PlannedPathCard key={path.id} path={path} />
				))}
			</CardGroup>
		</section>
	);
}

/** An audience landing's body: the reader's countries, its paths first, those announced next, then every other page of the audience under its sidebar topic. */
export function AudienceIndex() {
	const { audienceIndex } = useDocsGuide();
	if (!audienceIndex) {
		throw new Error(
			"<AudienceIndex /> belongs on a page the site declares as an audience landing",
		);
	}
	return (
		<>
			<ReaderContextPicker audience={audienceIndex.audience} />
			<PathCards paths={audienceIndex.paths} planned={audienceIndex.planned} />
			{audienceIndex.topics.map((topic) => (
				<section key={topic.label} className="docs-flow">
					<h2>{topic.label}</h2>
					<CardGroup cols={2}>
						{topic.pages.map((page) => (
							<PageCard key={page.href} page={page} />
						))}
					</CardGroup>
				</section>
			))}
		</>
	);
}

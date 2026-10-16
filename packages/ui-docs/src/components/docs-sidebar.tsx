import { CaretRightIcon } from "@phosphor-icons/react";
import {
	isNavFolder,
	type NavAudience,
	type NavEntry,
	type NavFolder,
	type NavGroup,
	type NavItem,
	navItemsOf,
} from "@voila.dev/docs/navigation";
import { useEffect } from "react";
import { cn } from "../lib/cn.ts";
import { useStoredChoice } from "../lib/stored-choice.ts";
import { Chip, methodTone } from "./chip.tsx";
import { DocsLink } from "./docs-link.tsx";
import { useDocs } from "./docs-provider.tsx";
import { useReaderContext } from "./reader-context.tsx";
import { ReaderContextChip } from "./reader-context-chip.tsx";

/** A folder's entries indent their text, not their row: the highlight keeps the sidebar's width. */
const DEPTH_PADDING = ["pl-4", "pl-7", "pl-10", "pl-13"] as const;

function depthPadding(depth: number): string {
	return DEPTH_PADDING[Math.min(depth, DEPTH_PADDING.length - 1)] ?? "pl-4";
}

/** An item's sidebar title; its tooltip holds the full title when the sidebar shortens it, and the reason it is dimmed when it is written for another reader context. */
function ItemTitle({ item, reason }: { item: NavItem; reason?: string }) {
	const shown = item.sidebarTitle ?? item.title;
	const tooltip = [shown === item.title ? undefined : item.title, reason]
		.filter((part) => part !== undefined)
		.join(" · ");
	return (
		<>
			<span
				className="min-w-0 text-pretty"
				{...(tooltip ? { title: tooltip } : {})}
			>
				{shown}
			</span>
			{reason ? <span className="sr-only">{reason}</span> : null}
		</>
	);
}

/** An operation's HTTP method, or a page's icon. */
function ItemGlyph({ item, current }: { item: NavItem; current: boolean }) {
	const { icons } = useDocs();
	const Icon = item.icon && !item.method ? icons[item.icon] : undefined;
	return (
		<>
			{item.method ? (
				<Chip
					tone={methodTone(item.method)}
					size="xs"
					solid={current}
					className="mt-0.5 w-9 shrink-0 justify-center"
				>
					{item.method}
				</Chip>
			) : null}
			{Icon ? (
				<Icon className="mt-0.5 size-4 shrink-0 opacity-70" aria-hidden />
			) : null}
		</>
	);
}

function ItemLink({
	item,
	current,
	depth,
	onNavigate,
}: {
	item: NavItem;
	current: boolean;
	depth: number;
	onNavigate?: () => void;
}) {
	const { reasonFor } = useReaderContext();
	const reason = reasonFor(item.href);
	return (
		<DocsLink
			href={item.href}
			onClick={onNavigate}
			aria-current={current ? "page" : undefined}
			className={cn(
				"flex min-h-8 items-start gap-2.5 rounded-xl py-1.5 pr-3 text-docs-sm leading-5 transition-colors",
				depthPadding(depth),
				reason !== undefined && !current && "opacity-50",
				current
					? "bg-foreground/10 font-medium text-foreground"
					: "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
			)}
		>
			<ItemGlyph item={item} current={current} />
			<ItemTitle item={item} {...(reason ? { reason } : {})} />
		</DocsLink>
	);
}

/** A folder opens on the page it holds; the reader may open or close any other. */
function FolderEntry({
	folder,
	pathname,
	depth,
	onNavigate,
}: {
	folder: NavFolder;
	pathname: string;
	depth: number;
	onNavigate?: () => void;
}) {
	const holdsCurrent = navItemsOf(folder.items).some(
		(item) => item.href === pathname,
	);
	return (
		<details open={holdsCurrent || undefined} className="group/folder">
			<summary
				className={cn(
					"flex min-h-8 cursor-pointer list-none items-start justify-between gap-2 rounded-xl py-1.5 pr-3 text-docs-sm text-foreground/75 leading-5 transition-colors hover:bg-foreground/5 hover:text-foreground [&::-webkit-details-marker]:hidden",
					depthPadding(depth),
				)}
			>
				<span className="min-w-0 text-pretty">{folder.label}</span>
				<CaretRightIcon
					className="mt-1 size-3 shrink-0 opacity-60 transition-transform group-open/folder:rotate-90"
					aria-hidden
				/>
			</summary>
			<div className="mt-px">
				<EntryList
					entries={folder.items}
					pathname={pathname}
					depth={depth + 1}
					{...(onNavigate ? { onNavigate } : {})}
				/>
			</div>
		</details>
	);
}

function EntryList({
	entries,
	pathname,
	depth = 0,
	onNavigate,
}: {
	entries: ReadonlyArray<NavEntry>;
	pathname: string;
	depth?: number;
	onNavigate?: () => void;
}) {
	const navigate = onNavigate ? { onNavigate } : {};
	return (
		<ul className="space-y-px">
			{entries.map((entry) => (
				<li key={isNavFolder(entry) ? entry.label : entry.href}>
					{isNavFolder(entry) ? (
						<FolderEntry
							folder={entry}
							pathname={pathname}
							depth={depth}
							{...navigate}
						/>
					) : (
						<ItemLink
							item={entry}
							current={entry.href === pathname}
							depth={depth}
							{...navigate}
						/>
					)}
				</li>
			))}
		</ul>
	);
}

/** One segment per audience, each opening its landing. */
function AudienceSwitcher({
	audiences,
	current,
	onChoose,
	onNavigate,
}: {
	audiences: ReadonlyArray<NavAudience>;
	current: string | undefined;
	onChoose: (audience: string) => void;
	onNavigate?: () => void;
}) {
	const { messages } = useDocs();
	return (
		<nav
			aria-label={messages.guide.audienceSwitcherAria}
			className="flex gap-1 rounded-xl bg-foreground/[0.05] p-1"
		>
			{audiences.map((audience) => (
				<DocsLink
					key={audience.id}
					href={audience.href}
					aria-current={audience.id === current ? "true" : undefined}
					onClick={() => {
						onChoose(audience.id);
						onNavigate?.();
					}}
					className={cn(
						"flex min-w-0 flex-1 items-center justify-center text-balance rounded-lg px-2 py-1.5 text-center font-medium text-xs leading-4 transition-colors",
						audience.id === current
							? "bg-background text-foreground shadow-xs"
							: "text-foreground/65 hover:text-foreground",
					)}
				>
					{audience.label}
				</DocsLink>
			))}
		</nav>
	);
}

/**
 * The audience whose groups the sidebar shows: the page's own, else the one
 * the reader chose last. With neither, every group shows.
 */
function useSidebarAudience(audiences: ReadonlyArray<NavAudience>) {
	const { navigation, audienceStorageKey } = useDocs();
	const [stored, choose] = useStoredChoice(audienceStorageKey);
	const pageAudience = navigation.location?.group.audience;
	useEffect(() => {
		if (pageAudience && pageAudience !== stored) {
			choose(pageAudience);
		}
	});
	const known = audiences.some((audience) => audience.id === stored);
	return {
		current: pageAudience ?? (known ? stored : undefined),
		choose,
	};
}

/** A topic: a small muted label over its pages, the resend.com/docs way. */
function GroupSection({
	group,
	pathname,
	heading: Heading,
	onNavigate,
}: {
	group: NavGroup;
	pathname: string;
	heading: "h2" | "h3";
	onNavigate?: () => void;
}) {
	return (
		<section>
			<Heading className="mb-1.5 text-pretty pr-3 pl-4 font-medium text-muted-foreground text-xs leading-5">
				{group.label}
			</Heading>
			<EntryList
				entries={group.items}
				pathname={pathname}
				{...(onNavigate ? { onNavigate } : {})}
			/>
		</section>
	);
}

/** What the sidebar lists in order: a group of every reader, or the topics of one audience. */
type SidebarBlock =
	| { group: NavGroup }
	| { audience: NavAudience; groups: Array<NavGroup> };

function blocksOf(
	groups: ReadonlyArray<NavGroup>,
	audiences: ReadonlyArray<NavAudience>,
): Array<SidebarBlock> {
	const blocks: Array<SidebarBlock> = [];
	for (const group of groups) {
		const audience = audiences.find((entry) => entry.id === group.audience);
		const last = blocks.at(-1);
		if (audience && last && "audience" in last && last.audience === audience) {
			last.groups.push(group);
			continue;
		}
		blocks.push(audience ? { audience, groups: [group] } : { group });
	}
	return blocks;
}

/** An audience's topics; named when several audiences show at once, since the switcher then marks none. */
function AudienceTopics({
	audience,
	groups,
	named,
	pathname,
	onNavigate,
}: {
	audience: NavAudience;
	groups: ReadonlyArray<NavGroup>;
	named: boolean;
	pathname: string;
	onNavigate?: () => void;
}) {
	const navigate = onNavigate ? { onNavigate } : {};
	const topics = groups.map((group) => (
		<GroupSection
			key={group.label}
			group={group}
			pathname={pathname}
			heading={named ? "h3" : "h2"}
			{...navigate}
		/>
	));
	return named ? (
		<section className="space-y-4">
			<h2 className="text-pretty pr-3 pl-4 font-semibold text-docs-sm text-foreground">
				{audience.label}
			</h2>
			{topics}
		</section>
	) : (
		<div className="space-y-6">{topics}</div>
	);
}

/**
 * The active tab's groups, the account group always, an audience's topics
 * while the reader is in it. Before any audience is chosen, every audience's
 * topics show under its name. The tabs themselves sit in the header.
 */
export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
	const { navigation, messages } = useDocs();
	const { activeTab, pathname } = navigation;
	const audiences = activeTab?.audiences ?? [];
	const { current, choose } = useSidebarAudience(audiences);
	if (!activeTab) {
		return null;
	}
	const navigate = onNavigate ? { onNavigate } : {};
	const blocks = blocksOf(activeTab.groups, audiences).filter(
		(block) =>
			!("audience" in block) ||
			current === undefined ||
			block.audience.id === current,
	);
	return (
		<div className="space-y-6">
			{audiences.length > 1 ? (
				<AudienceSwitcher
					audiences={audiences}
					current={current}
					onChoose={choose}
					{...navigate}
				/>
			) : null}
			{current ? <ReaderContextChip audience={current} /> : null}
			<nav aria-label={messages.sidebarAria} className="space-y-6">
				{blocks.map((block) =>
					"group" in block ? (
						<GroupSection
							key={block.group.label}
							group={block.group}
							pathname={pathname}
							heading="h2"
							{...navigate}
						/>
					) : (
						<AudienceTopics
							key={block.audience.id}
							audience={block.audience}
							groups={block.groups}
							named={current === undefined}
							pathname={pathname}
							{...navigate}
						/>
					),
				)}
			</nav>
		</div>
	);
}

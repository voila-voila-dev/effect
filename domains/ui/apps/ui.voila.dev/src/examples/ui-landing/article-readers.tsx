import {
	type ContentValue,
	contentToHtml,
	createContentReaders,
} from "@voila.dev/ui/content-editor/reader";
import { ProseArticle, withArticleReaders } from "@voila.dev/ui/landing";

const READERS = withArticleReaders(createContentReaders(), {
	figure: { sizes: "(min-width: 768px) 40rem, 100vw" },
});

const body: ContentValue = [
	{ type: "h2", id: "rates", children: [{ text: "What a launch costs" }] },
	{
		type: "p",
		children: [
			{ text: "Most teams budget for the build and forget the " },
			{ text: "week after launch", bold: true },
			{ text: ", when every fix is urgent." },
		],
	},
	{
		type: "table",
		children: [
			{
				type: "tr",
				children: [
					{
						type: "th",
						children: [{ type: "p", children: [{ text: "Phase" }] }],
					},
					{
						type: "th",
						children: [{ type: "p", children: [{ text: "Days" }] }],
					},
					{
						type: "th",
						children: [{ type: "p", children: [{ text: "Typical rate" }] }],
					},
				],
			},
			{
				type: "tr",
				children: [
					{
						type: "td",
						children: [{ type: "p", children: [{ text: "Design" }] }],
					},
					{ type: "td", children: [{ type: "p", children: [{ text: "8" }] }] },
					{
						type: "td",
						children: [{ type: "p", children: [{ text: "$650 / day" }] }],
					},
				],
			},
			{
				type: "tr",
				children: [
					{
						type: "td",
						children: [{ type: "p", children: [{ text: "Build" }] }],
					},
					{ type: "td", children: [{ type: "p", children: [{ text: "20" }] }] },
					{
						type: "td",
						children: [{ type: "p", children: [{ text: "$720 / day" }] }],
					},
				],
			},
		],
	},
	{ type: "h3", id: "after", children: [{ text: "After the launch" }] },
	{
		type: "p",
		children: [
			{ text: "Keep a few days in reserve. Hover a heading for its link." },
		],
	},
];

export function Default() {
	return (
		<ProseArticle
			dangerouslySetInnerHTML={{
				__html: contentToHtml(body, { features: READERS }),
			}}
		/>
	);
}

import type { Meta, StoryObj } from "@storybook/tanstack-react";
import {
	defaultFilterLabels,
	type EntityFilterOption,
	Filter,
	type FilterDefinition,
	type FilterValues,
	type PlaceSuggestion,
} from "@voila.dev/ui/filter";
import { useState } from "react";

// Stand-in for the app's geocoder: enough French towns to try the field.
const TOWNS: ReadonlyArray<PlaceSuggestion> = [
	{
		id: "nantes",
		label: "Nantes, Loire-Atlantique",
		latitude: 47.2184,
		longitude: -1.5536,
	},
	{
		id: "paris",
		label: "Paris, Île-de-France",
		latitude: 48.8566,
		longitude: 2.3522,
	},
	{ id: "lyon", label: "Lyon, Rhône", latitude: 45.764, longitude: 4.8357 },
	{
		id: "bordeaux",
		label: "Bordeaux, Gironde",
		latitude: 44.8378,
		longitude: -0.5792,
	},
	{
		id: "rennes",
		label: "Rennes, Ille-et-Vilaine",
		latitude: 48.1173,
		longitude: -1.6778,
	},
	{
		id: "guipry",
		label: "Guipry-Messac, Ille-et-Vilaine",
		latitude: 47.8236,
		longitude: -1.8447,
	},
];

const searchTowns = async (
	query: string,
): Promise<ReadonlyArray<PlaceSuggestion>> => {
	const normalized = query.trim().toLowerCase();
	return TOWNS.filter((town) => town.label.toLowerCase().includes(normalized));
};

const CUSTOMERS: ReadonlyArray<EntityFilterOption> = [
	{ id: "cus_acme", label: "Acme Corporation" },
	{ id: "cus_globex", label: "Globex" },
	{ id: "cus_initech", label: "Initech" },
];

const searchCustomers = async (
	query: string,
): Promise<ReadonlyArray<EntityFilterOption>> => {
	const normalized = query.trim().toLowerCase();
	return CUSTOMERS.filter((customer) =>
		customer.label.toLowerCase().includes(normalized),
	);
};

const definitions: ReadonlyArray<FilterDefinition> = [
	{
		kind: "text",
		key: "recipient",
		label: "Recipient",
		placeholder: "name@example.com",
		allowExclusion: true,
	},
	{
		kind: "select",
		key: "status",
		label: "Status",
		multiple: true,
		allowExclusion: true,
		options: [
			{ value: "sent", label: "Sent" },
			{ value: "suppressed", label: "Suppressed" },
			{ value: "failed", label: "Failed" },
		],
	},
	{
		kind: "select",
		key: "skill",
		label: "Skill",
		description: "A long list gets its own search box.",
		multiple: true,
		options: [
			"Designer",
			"Developer",
			"Data analyst",
			"Copywriter",
			"Consultant",
			"Illustrator",
			"Video editor",
			"SEO specialist",
			"Translator",
		].map((label) => ({ value: label.toLowerCase(), label })),
	},
	{
		kind: "geoRadius",
		key: "near",
		label: "Around",
		description: "Type a town — Nantes, Rennes, Lyon…",
		searchPlaces: searchTowns,
		defaultKm: 30,
	},
	{
		kind: "entity",
		key: "customer",
		label: "Customer",
		description: "Looked up as you type — try “ac” or “gl”.",
		multiple: true,
		allowExclusion: true,
		searchOptions: searchCustomers,
	},
	{
		kind: "dateRange",
		key: "sentAt",
		label: "Sent",
		presets: [
			{ label: "Since 2026", from: "2026-01-01" },
			{ label: "Until 2025", to: "2025-12-31" },
		],
	},
	{
		kind: "moneyRange",
		key: "price",
		label: "Project budget",
		currency: "EUR",
	},
	{
		kind: "numberRange",
		key: "radius",
		label: "Travel radius",
		unit: "km",
		min: 0,
		max: 200,
		step: 5,
	},
	{
		kind: "boolean",
		key: "opened",
		label: "Opened",
		trueLabel: "Opened",
		falseLabel: "Not opened",
	},
];

const frenchLabels = {
	trigger: "Rechercher et filtrer",
	title: "Filtres",
	apply: "Appliquer",
	clear: "Effacer",
	clearAll: "Tout effacer",
	search: "Rechercher",
	searchPlaceholder: "Rechercher par destinataire ou objet…",
	optionSearchPlaceholder: "Rechercher…",
	around: (place: string, kilometres: number) =>
		`${kilometres} km autour de ${place}`,
	placePlaceholder: "Ville, adresse…",
	placeNoResults: "Aucun lieu trouvé.",
	radius: "Rayon",
	changePlace: "Changer",
	is: "est",
	isNot: "n'est pas",
	from: "Du",
	to: "Au",
	min: "Min",
	max: "Max",
	remove: "Retirer",
	close: "Fermer",
	filterSearchPlaceholder: "Rechercher un filtre…",
	noFilterFound: "Aucun filtre ne correspond.",
	entityNoResults: "Aucun résultat.",
	resultCount: (count: number) => `${count} résultats`,
	selectedCount: (count: number) => `${count} sélectionnés`,
	moreOptions: (count: number) => `${count} de plus…`,
	lessOptions: "Afficher moins",
};

function FilterRootFixture({
	labels,
	locale,
	mode,
}: {
	labels?: Partial<typeof defaultFilterLabels>;
	locale?: string;
	mode?: "apply" | "live";
}) {
	const [values, setValues] = useState<FilterValues>({
		status: { kind: "select", values: ["failed"], excluded: false },
	});
	const [search, setSearch] = useState("");

	return (
		<div className="flex max-w-3xl flex-col gap-6">
			<Filter.Root
				mode={mode}
				definitions={definitions}
				values={values}
				onValuesChange={setValues}
				searchValue={search}
				onSearchChange={setSearch}
				resultCount={42}
				labels={labels}
				locale={locale}
			/>
			<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
				{JSON.stringify({ search, values }, null, 2)}
			</pre>
		</div>
	);
}

// The stories drive a stateful fixture (a filter bar owns applied values), so
// the meta is typed against it rather than the bare component.
const meta = {
	title: "UI Filters/Filter.Root",
	component: FilterRootFixture,
	tags: ["autodocs"],
} satisfies Meta<typeof FilterRootFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Resize below 768px to get the bottom drawer and the native date pickers. */
export const Default: Story = {
	render: () => <FilterRootFixture />,
};

export const French: Story = {
	render: () => <FilterRootFixture labels={frenchLabels} locale="fr-FR" />,
};

/** `mode="live"`: a real search input, and a side sheet that applies as you go. */
export const Live: Story = {
	render: () => <FilterRootFixture mode="live" />,
};

/** The bar's button toggles a rail docked beside the list (a drawer on mobile). */
export const Docked: Story = {
	render: function DockedStory() {
		const [values, setValues] = useState<FilterValues>({});
		const [search, setSearch] = useState("");
		const [open, setOpen] = useState(true);
		return (
			<div className="flex flex-col gap-4">
				<Filter.Root
					mode="live"
					definitions={definitions}
					values={values}
					onValuesChange={setValues}
					searchValue={search}
					onSearchChange={setSearch}
					resultCount={42}
					open={open}
					onOpenChange={setOpen}
					panelRenderedElsewhere
				/>
				<div className="flex gap-4">
					<pre className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
						{JSON.stringify({ search, values }, null, 2)}
					</pre>
					<Filter.Dock
						open={open}
						onOpenChange={setOpen}
						definitions={definitions}
						values={values}
						onValuesChange={setValues}
					/>
				</div>
			</div>
		);
	},
};

/** The editor on its own, for a screen that shows filters inline. */
export const InlineForm: Story = {
	render: function InlineFormStory() {
		const [values, setValues] = useState<FilterValues>({});
		return (
			<div className="max-w-xl">
				<Filter.Form
					definitions={definitions}
					values={values}
					onValuesChange={setValues}
					labels={defaultFilterLabels}
					locale="en-US"
				/>
			</div>
		);
	},
};

/** The geo filter on its own: pick a town, then size the circle on the map. */
export const AroundAPlace: Story = {
	render: function AroundAPlaceStory() {
		const [values, setValues] = useState<FilterValues>({});
		return (
			<div className="flex max-w-xl flex-col gap-4">
				<Filter.Form
					definitions={definitions.filter(
						(definition) => definition.kind === "geoRadius",
					)}
					values={values}
					onValuesChange={setValues}
					labels={defaultFilterLabels}
					locale="en-US"
				/>
				<pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
					{JSON.stringify(values, null, 2)}
				</pre>
			</div>
		);
	},
};

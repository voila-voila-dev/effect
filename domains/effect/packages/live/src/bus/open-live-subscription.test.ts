import { describe, expect, it } from "bun:test";
import { Gate, permissionRef } from "@voila.dev/effect-ddd";
import { DateTime, Effect, Exit, Layer, Option, Schema } from "effect";
import { defineLiveChannel } from "../channel/live-channel.ts";
import { LiveChannelName } from "../message/live-channel-name.ts";
import type { LiveMessage } from "../message/live-message.ts";
import { LiveLog } from "./live-log.ts";
import { openLiveSubscription } from "./open-live-subscription.ts";

interface Viewer {
	readonly actor: { readonly role: "staff" | "customer" };
}

const staffBoard = defineLiveChannel({
	name: LiveChannelName.make("staff-board"),
	gate: Gate.when<Viewer>({
		label: "staff",
		permissions: [permissionRef("staff", "board")],
		allows: ({ actor }) => actor.role === "staff",
	}),
	filter: Schema.Struct({ regions: Schema.Array(Schema.String) }),
	matches: (filter, message) =>
		filter.regions.includes(message.attributes.region ?? ""),
});

const channels = new Map([[staffBoard.name, staffBoard]]);

const kept = [placedIn("35", "1"), placedIn("29", "2"), placedIn("75", "3")];

const log = Layer.succeed(LiveLog, {
	since: (_channel, seq) =>
		Effect.succeed(kept.filter((message) => Number(message.seq) > Number(seq))),
});

function open(role: Viewer["actor"]["role"], channel: string, since?: string) {
	return Effect.runPromiseExit(
		openLiveSubscription({
			channels,
			channel,
			input: { actor: { role } },
			since,
		}).pipe(Effect.provide(log)),
	);
}

function failureTag(exit: Exit.Exit<unknown, { readonly _tag: string }>) {
	return Exit.isFailure(exit)
		? Option.map(Exit.findErrorOption(exit), (error) => error._tag)
		: Option.none();
}

function placedIn(region: string, seq = "1"): LiveMessage {
	return {
		channel: staffBoard.name,
		subjectType: "order",
		subjectId: "o-1",
		kind: "order.placed",
		at: DateTime.makeUnsafe("2026-10-14T09:30:00Z"),
		attributes: { region },
		seq,
	};
}

describe("openLiveSubscription", () => {
	it("answers what the page missed after `since`", async () => {
		const exit = await open("staff", "staff-board", "1");
		expect(
			Exit.isSuccess(exit) ? exit.value.map((message) => message.seq) : [],
		).toEqual(["2", "3"]);
	});

	it("admits the input the channel's gate admits", async () => {
		expect(Exit.isSuccess(await open("staff", "staff-board"))).toBe(true);
	});

	it("refuses the input the channel's gate refuses", async () => {
		expect(failureTag(await open("customer", "staff-board"))).toEqual(
			Option.some("AccessDeniedError"),
		);
	});

	it("refuses a channel nobody declared", async () => {
		expect(failureTag(await open("staff", "nowhere"))).toEqual(
			Option.some("LiveChannelNotFoundError"),
		);
	});
});

describe("a channel's matcher", () => {
	it("keeps every message without a filter", () => {
		const keeps = Option.getOrThrow(staffBoard.matcher(undefined));
		expect(keeps(placedIn("35"))).toBe(true);
	});

	it("keeps the messages its filter names", () => {
		const keeps = Option.getOrThrow(
			staffBoard.matcher({ regions: ["35", "29"] }),
		);
		expect([keeps(placedIn("35")), keeps(placedIn("75"))]).toEqual([
			true,
			false,
		]);
	});

	it("reads no filter it cannot decode", () => {
		expect(Option.isNone(staffBoard.matcher({ regions: "35" }))).toBe(true);
	});
});

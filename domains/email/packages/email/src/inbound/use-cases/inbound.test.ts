import { describe, expect, it } from "bun:test";
import { makeHmacTokenSigner, TokenSigner } from "@voila.dev/crypto";
import { DateTime, Effect, Layer, Option } from "effect";
import { TestClock } from "effect/testing";
import { inMemoryEmailLogRepository } from "../../delivery/adapters/in-memory-email-log-repository.ts";
import { EmailLog } from "../../delivery/aggregates/email-log.ts";
import { EmailLogId } from "../../delivery/value-objects/email-log-id.ts";
import { systemActor } from "../../email-domain.test-helper.ts";
import { EmailIds } from "../../ids/email-ids.ts";
import { EmailAddress } from "../../message/value-objects/email-address.ts";
import { inMemoryInboundEmailFetcher } from "../adapters/in-memory-inbound-email-fetcher.ts";
import { inMemoryInboundEmailRepository } from "../adapters/in-memory-inbound-email-repository.ts";
import { signedReplyAddresses } from "../adapters/signed-reply-addresses.ts";
import type { FetchedInboundContent } from "../services/inbound-email-fetcher.ts";
import {
	InboundEmailHandler,
	type InboundRoutingOutcome,
} from "../services/inbound-email-handler.ts";
import { InboundEmailSettings } from "../services/inbound-email-settings.ts";
import { ReplyAddresses } from "../services/reply-addresses.ts";
import { FetchInboundAttachmentUseCase } from "./fetch-inbound-attachment-use-case.ts";
import { RecordInboundEmailUseCase } from "./record-inbound-email-use-case.ts";
import { RouteInboundEmailUseCase } from "./route-inbound-email-use-case.ts";

const content: FetchedInboundContent = {
	text: "Merci, c'est noté.",
	html: null,
	spf: "Pass",
	dkim: "Pass",
	dmarc: "Pass",
	headers: {},
};

function inboundDomain() {
	const repository = inMemoryInboundEmailRepository();
	const fetcher = inMemoryInboundEmailFetcher();
	const logs = inMemoryEmailLogRepository();
	const handled: Array<string> = [];
	const handler = Layer.succeed(InboundEmailHandler, {
		handle: ({ payload }) =>
			Effect.sync((): InboundRoutingOutcome => {
				handled.push(payload);
				return { status: "routed", reference: `conversation:${payload}` };
			}),
	});
	const replyAddresses = signedReplyAddresses({
		domain: "reply.example.com",
	}).pipe(
		Layer.provide(
			Layer.effect(TokenSigner, makeHmacTokenSigner("s".repeat(32))),
		),
	);
	const layer = Layer.mergeAll(
		repository.layer,
		fetcher.layer,
		logs.layer,
		handler,
		replyAddresses,
		TestClock.layer(),
	);
	let count = 0;

	function run<A, E>(
		program: Effect.Effect<A, E, Layer.Success<typeof layer>>,
	) {
		return Effect.runPromise(
			program.pipe(
				Effect.provideService(EmailIds, {
					next: Effect.sync(() => `in-${++count}`),
				}),
				Effect.provideService(InboundEmailSettings, {
					ownDomains: ["example.com"],
				}),
				Effect.provide(layer),
			),
		);
	}

	function receive(input: {
		readonly to: string;
		readonly from?: string;
		readonly headers?: Record<string, string>;
		readonly id?: string;
	}) {
		const id = input.id ?? "msg-1";
		fetcher.contents.set(id, { ...content, headers: input.headers ?? {} });
		return RecordInboundEmailUseCase.execute({
			actor: systemActor,
			payload: {
				providerMessageId: id,
				from: EmailAddress.make(input.from ?? "marie@client.fr"),
				to: input.to,
				subject: "Re: votre mission",
				attachments: [],
				receivedAt: DateTime.makeUnsafe(0),
			},
		}).pipe(
			Effect.flatMap((inbound) =>
				RouteInboundEmailUseCase.execute({
					actor: systemActor,
					payload: { inbound },
				}),
			),
		);
	}

	const mint = (payload: string) =>
		Effect.flatMap(ReplyAddresses, (addresses) =>
			addresses.mint({ payload, expiresAt: DateTime.makeUnsafe(86_400_000) }),
		);

	return { repository, fetcher, logs, handled, run, receive, mint };
}

describe("received mail", () => {
	it("stores a message once, however many times the webhook comes", async () => {
		const domain = inboundDomain();
		await domain.run(
			Effect.gen(function* () {
				yield* domain.receive({ to: "hello@reply.example.com" });
				domain.fetcher.contents.clear();
				yield* domain.receive({ to: "hello@reply.example.com" });
			}),
		);
		expect(domain.repository.emails.size).toBe(1);
	});

	it("routes a reply to one of our addresses through the application's handler", async () => {
		const domain = inboundDomain();
		const routed = await domain.run(
			Effect.flatMap(domain.mint("conv42"), (to) => domain.receive({ to })),
		);
		expect(routed.outcome).toBe("routed");
		expect(routed.routedReference).toBe("conversation:conv42");
		expect(domain.handled).toEqual(["conv42"]);
	});

	it("keeps a message to no address of ours as unroutable", async () => {
		const domain = inboundDomain();
		const stored = await domain.run(
			domain.receive({ to: "contact@reply.example.com" }),
		);
		expect(stored.outcome).toBe("unroutable");
		expect(stored.rawText).toBe("Merci, c'est noté.");
	});

	it("refuses an auto-reply before reading its token", async () => {
		const domain = inboundDomain();
		const outcomes = await domain.run(
			Effect.gen(function* () {
				const to = yield* domain.mint("conv42");
				return yield* Effect.all([
					domain.receive({
						to,
						id: "a",
						headers: { "auto-submitted": "auto-replied" },
					}),
					domain.receive({ to, id: "b", from: "mailer-daemon@client.fr" }),
					domain.receive({
						to,
						id: "c",
						from: "notifications@mail.example.com",
					}),
				]);
			}),
		);
		expect(outcomes.map((inbound) => inbound.outcome)).toEqual([
			"rejected",
			"rejected",
			"rejected",
		]);
		expect(domain.handled).toEqual([]);
	});

	it("finds the reply address by the Message-ID a reply quotes", async () => {
		const domain = inboundDomain();
		const routed = await domain.run(
			Effect.gen(function* () {
				const replyTo = yield* domain.mint("conv7");
				const sent = EmailLog.pending({
					id: EmailLogId.make("log-1"),
					message: {
						from: "hello@example.com",
						to: [EmailAddress.make("marie@client.fr")],
						replyTo: [replyTo],
						subject: "Votre mission",
						text: "…",
					},
					stream: "Notification",
					resendOfId: null,
					dedupeKey: null,
					createdAt: DateTime.makeUnsafe(0),
				});
				domain.logs.logs.set(
					sent.id,
					new EmailLog({ ...sent, rfcMessageId: "<abc@mail.example>" }),
				);
				return yield* domain.receive({
					to: "hello@example.com",
					headers: { "in-reply-to": "<abc@mail.example>" },
				});
			}),
		);
		expect(routed.outcome).toBe("routed");
		expect(domain.handled).toEqual(["conv7"]);
	});

	it("hands over a received file only when the policy allows it", async () => {
		const domain = inboundDomain();
		domain.fetcher.attachments.set("msg-1/pdf", {
			bytes: new Uint8Array([1, 2, 3]),
			contentType: "application/pdf; name=devis.pdf",
		});
		domain.fetcher.attachments.set("msg-1/html", {
			bytes: new Uint8Array([1]),
			contentType: "text/html",
		});
		const [pdf, html] = await domain.run(
			Effect.forEach(["pdf", "html"], (attachmentId) =>
				FetchInboundAttachmentUseCase.execute({
					actor: systemActor,
					payload: { providerMessageId: "msg-1", attachmentId },
				}),
			),
		);
		expect(pdf !== undefined && Option.isSome(pdf)).toBe(true);
		expect(html !== undefined && Option.isNone(html)).toBe(true);
	});
});

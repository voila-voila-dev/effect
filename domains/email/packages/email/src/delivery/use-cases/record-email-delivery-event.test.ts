import { describe, expect, it } from "bun:test";
import { DateTime, Effect } from "effect";
import { TestClock } from "effect/testing";
import {
	emailDomain,
	message,
	systemActor,
} from "../../email-domain.test-helper.ts";
import type { EmailDeliveryEvent } from "../payloads/email-delivery-event.ts";
import { RecordEmailDeliveryEventUseCase } from "./record-email-delivery-event-use-case.ts";
import { SendEmailUseCase } from "./send-email-use-case.ts";

function event(
	overrides: Partial<EmailDeliveryEvent> & Pick<EmailDeliveryEvent, "outcome">,
): EmailDeliveryEvent {
	return {
		providerMessageId: "email-1",
		recipient: "Marie@Example.fr",
		bounceKind: null,
		detail: null,
		rfcMessageId: null,
		occurredAt: DateTime.makeUnsafe(60_000),
		...overrides,
	};
}

function record(delivery: EmailDeliveryEvent) {
	return RecordEmailDeliveryEventUseCase.execute({
		actor: systemActor,
		payload: { event: delivery },
	});
}

const sendOne = SendEmailUseCase.execute({
	actor: systemActor,
	payload: { message: message(), stream: "Transactional" },
});

describe("RecordEmailDeliveryEventUseCase", () => {
	it("amends the log with the outcome and the real Message-ID", async () => {
		const domain = emailDomain();
		const id = await domain.run(
			Effect.gen(function* () {
				const sent = yield* sendOne;
				yield* record(
					event({ outcome: "delivered", rfcMessageId: "<abc@mail.example>" }),
				);
				return sent;
			}),
		);
		const log = domain.logs.logs.get(id);
		expect(log?.status).toBe("delivered");
		expect(log?.deliveredAt).toEqual(DateTime.makeUnsafe(60_000));
		expect(log?.rfcMessageId).toBe("<abc@mail.example>");
	});

	it("keeps the worst outcome when a delivery lands after the complaint", async () => {
		const domain = emailDomain();
		const id = await domain.run(
			Effect.gen(function* () {
				const sent = yield* sendOne;
				yield* record(event({ outcome: "complained" }));
				yield* record(event({ outcome: "delivered" }));
				return sent;
			}),
		);
		const log = domain.logs.logs.get(id);
		expect(log?.status).toBe("complained");
		expect(log?.deliveredAt).not.toBeNull();
	});

	it("suppresses a hard bounce, even with no log to amend", async () => {
		const domain = emailDomain();
		const outcome = await domain.run(
			record(event({ outcome: "bounced", bounceKind: "Hard", detail: "550" })),
		);
		expect(outcome).toEqual({
			matchedLog: false,
			suppressedFor: "HardBounce",
			email: "marie@example.fr",
		});
		expect(domain.suppressions.addresses.get("marie@example.fr")).toMatchObject(
			{ reason: "HardBounce", providerDetail: "550" },
		);
	});

	it("escalates a suppression to a complaint and keeps when it started", async () => {
		const domain = emailDomain();
		await domain.run(
			Effect.gen(function* () {
				yield* record(event({ outcome: "bounced", bounceKind: "Hard" }));
				yield* TestClock.adjust("1 hour");
				yield* record(
					event({
						outcome: "complained",
						occurredAt: DateTime.makeUnsafe(3_600_000),
					}),
				);
			}),
		);
		const entry = domain.suppressions.addresses.get("marie@example.fr");
		expect(entry?.reason).toBe("Complaint");
		expect(entry?.firstSuppressedAt).toEqual(DateTime.makeUnsafe(60_000));
		expect(entry?.lastConfirmedAt).toEqual(DateTime.makeUnsafe(3_600_000));
	});

	it("suppresses soft bounces only once they repeat with no delivery between", async () => {
		const domain = emailDomain();
		const outcomes = await domain.run(
			Effect.forEach([1, 2, 3], (index) =>
				Effect.gen(function* () {
					yield* sendOne;
					return yield* record(
						event({
							outcome: "bounced",
							bounceKind: "Soft",
							providerMessageId: `email-${index}`,
						}),
					);
				}),
			),
		);
		expect(outcomes.map((outcome) => outcome.suppressedFor)).toEqual([
			null,
			null,
			"RepeatedSoftBounce",
		]);
	});

	it("never suppresses on a blocked bounce or a deferral", async () => {
		const domain = emailDomain();
		await domain.run(
			Effect.gen(function* () {
				yield* record(event({ outcome: "bounced", bounceKind: "Blocked" }));
				yield* record(event({ outcome: "deferred" }));
			}),
		);
		expect(domain.suppressions.addresses.size).toBe(0);
	});
});

import { describe, expect, it } from "bun:test";
import { DateTime, Effect } from "effect";
import { TestClock } from "effect/testing";
import {
	emailDomain,
	message,
	operator,
	systemActor,
} from "../../email-domain.test-helper.ts";
import { EmailLog } from "../aggregates/email-log.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";
import { ProcessEmailOutboxUseCase } from "./process-email-outbox-use-case.ts";
import { SendEmailUseCase } from "./send-email-use-case.ts";

const sweep = ProcessEmailOutboxUseCase.execute({ actor: systemActor });

describe("ProcessEmailOutboxUseCase", () => {
	it("claims nothing on a healthy outbox", async () => {
		const domain = emailDomain();
		expect(await domain.run(sweep)).toEqual({
			processed: 0,
			sent: 0,
			suppressed: 0,
			retryScheduled: 0,
			failed: 0,
		});
	});

	it("retries a refused send once its next attempt is due", async () => {
		const domain = emailDomain();
		domain.sender.failingRecipients.add("marie@example.fr");
		const result = await domain.run(
			Effect.gen(function* () {
				yield* SendEmailUseCase.execute({
					actor: systemActor,
					payload: { message: message(), stream: "Transactional" },
				});
				const early = yield* sweep;
				domain.sender.failingRecipients.clear();
				yield* TestClock.adjust("30 seconds");
				return { early, due: yield* sweep };
			}),
		);
		expect(result.early.processed).toBe(0);
		expect(result.due).toMatchObject({ processed: 1, sent: 1 });
		expect([...domain.logs.logs.values()][0]?.status).toBe("sent");
	});

	it("drains the transactional stream before the campaigns", async () => {
		const domain = emailDomain();
		await domain.run(
			Effect.gen(function* () {
				const repository = yield* EmailLogRepository;
				const at = yield* DateTime.now;
				for (const [id, stream] of [
					["campaign", "Marketing"],
					["code", "Transactional"],
				] as const) {
					yield* repository.save(
						EmailLog.pending({
							id: EmailLogId.make(id),
							message: message(),
							stream,
							resendOfId: null,
							dedupeKey: null,
							createdAt: at,
						}),
					);
				}
				yield* sweep;
			}),
		);
		expect(domain.sender.sent.map((sent) => sent.id)).toEqual([
			"email-1",
			"email-2",
		]);
		expect(domain.logs.logs.get("code")?.providerMessageId).toBe("email-1");
	});

	it("may be run by hand by an operator holding the permission", async () => {
		const domain = emailDomain();
		const result = await domain.run(
			ProcessEmailOutboxUseCase.execute({
				actor: operator("email.outbox.process"),
			}),
		);
		expect(result.processed).toBe(0);
	});
});

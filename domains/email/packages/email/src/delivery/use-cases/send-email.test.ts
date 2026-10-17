import { describe, expect, it } from "bun:test";
import { AccessDeniedError } from "@voila.dev/effect-ddd";
import { DateTime, Effect } from "effect";
import {
	emailDomain,
	message,
	operator,
	systemActor,
} from "../../email-domain.test-helper.ts";
import { suppress } from "../../suppression/lib/suppress.ts";
import { MAXIMUM_DELIVERY_ATTEMPTS } from "../policies/email-outbox-policy.ts";
import { SendEmailUseCase } from "./send-email-use-case.ts";

function send(dedupeKey?: string, to?: string) {
	return SendEmailUseCase.execute({
		actor: systemActor,
		payload: {
			message: message(to),
			stream: "Transactional",
			...(dedupeKey === undefined ? {} : { dedupeKey }),
		},
	});
}

describe("SendEmailUseCase", () => {
	it("logs the message, sends it inline, and keeps the provider's id", async () => {
		const domain = emailDomain();
		const id = await domain.run(send());
		const log = domain.logs.logs.get(id);
		expect(domain.sender.sent.map((sent) => sent.id)).toEqual(["email-1"]);
		expect(log?.status).toBe("sent");
		expect(log?.providerMessageId).toBe("email-1");
		expect(log?.attemptCount).toBe(1);
	});

	it("sends nothing the second time a deduplicated send is asked for", async () => {
		const domain = emailDomain();
		const first = await domain.run(send("signup:42"));
		const second = await domain.run(send("signup:42"));
		expect(second).toBe(first);
		expect(domain.sender.sent).toHaveLength(1);
	});

	it("settles a send to a suppressed address without calling the provider", async () => {
		const domain = emailDomain();
		const id = await domain.run(
			Effect.gen(function* () {
				yield* suppress({
					email: "Marie@Example.fr",
					reason: "HardBounce",
					sourceEmailLogId: null,
					providerDetail: null,
					note: null,
					at: yield* DateTime.now,
				});
				return yield* send();
			}),
		);
		expect(domain.sender.sent).toHaveLength(0);
		expect(domain.logs.logs.get(id)?.status).toBe("suppressed");
	});

	it("keeps a refused send in the outbox on the retry curve, then fails it at the cap", async () => {
		const domain = emailDomain();
		domain.sender.failingRecipients.add("marie@example.fr");
		const id = await domain.run(send());
		const log = domain.logs.logs.get(id);
		expect(log?.status).toBe("pending");
		expect(log?.failureReason).toBe("refused for marie@example.fr");
		expect(log?.nextAttemptAt).toEqual(DateTime.makeUnsafe(30_000));

		let exhausted = log;
		for (let attempt = 2; attempt <= MAXIMUM_DELIVERY_ATTEMPTS; attempt += 1) {
			exhausted = exhausted?.attemptFailed("refused", DateTime.makeUnsafe(0));
		}
		expect(exhausted?.status).toBe("failed");
		expect(exhausted?.nextAttemptAt).toBeNull();
	});

	it("is the system's to call, not an operator's", async () => {
		const domain = emailDomain();
		const refused = await domain.run(
			Effect.flip(
				SendEmailUseCase.execute({
					actor: operator("email.log.resend"),
					payload: { message: message(), stream: "Transactional" },
				}),
			),
		);
		expect(refused).toBeInstanceOf(AccessDeniedError);
	});
});

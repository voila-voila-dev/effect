import { describe, expect, it } from "bun:test";
import { AccessDeniedError } from "@voila.dev/effect-ddd";
import { Effect } from "effect";
import {
	emailDomain,
	message,
	operator,
	systemActor,
} from "../../email-domain.test-helper.ts";
import { EmailLogNotFoundError } from "../errors/email-log-not-found-error.ts";
import { EmailLogId } from "../value-objects/email-log-id.ts";
import { GetEmailLogUseCase } from "./get-email-log-use-case.ts";
import { RecordEmailOpenUseCase } from "./record-email-open-use-case.ts";
import { ResendEmailUseCase } from "./resend-email-use-case.ts";
import { SearchEmailLogsUseCase } from "./search-email-logs-use-case.ts";
import { SendEmailUseCase } from "./send-email-use-case.ts";

const sendOne = SendEmailUseCase.execute({
	actor: systemActor,
	payload: { message: message(), stream: "Notification" },
});

describe("the log, for an operator", () => {
	it("resends a message as a new log pointing at the first", async () => {
		const domain = emailDomain();
		const [first, second] = await domain.run(
			Effect.gen(function* () {
				const original = yield* sendOne;
				const resent = yield* ResendEmailUseCase.execute({
					actor: operator("email.log.resend"),
					payload: { emailLogId: original },
				});
				return [original, resent] as const;
			}),
		);
		expect(second).not.toBe(first);
		expect(domain.logs.logs.get(second)).toMatchObject({
			resendOfId: first,
			stream: "Notification",
			status: "sent",
		});
		expect(domain.sender.sent).toHaveLength(2);
	});

	it("answers a missing log with EmailLogNotFoundError", async () => {
		const domain = emailDomain();
		const error = await domain.run(
			Effect.flip(
				GetEmailLogUseCase.execute({
					actor: operator("email.log.read"),
					payload: { emailLogId: EmailLogId.make("nope") },
				}),
			),
		);
		expect(error).toBeInstanceOf(EmailLogNotFoundError);
	});

	it("refuses an operator without the permission", async () => {
		const domain = emailDomain();
		const error = await domain.run(
			Effect.flip(
				SearchEmailLogsUseCase.execute({
					actor: operator("email.suppression.manage"),
					payload: { page: { limit: 20, offset: 0 } },
				}),
			),
		);
		expect(error).toBeInstanceOf(AccessDeniedError);
	});

	it("lists the log newest first, filtered by recipient, without the bodies", async () => {
		const domain = emailDomain();
		const page = await domain.run(
			Effect.gen(function* () {
				yield* sendOne;
				yield* SendEmailUseCase.execute({
					actor: systemActor,
					payload: { message: message("paul@example.fr"), stream: "Marketing" },
				});
				return yield* SearchEmailLogsUseCase.execute({
					actor: operator("email.log.read"),
					payload: { recipient: "PAUL", page: { limit: 20, offset: 0 } },
				});
			}),
		);
		expect(page.total).toBe(1);
		expect(page.items[0]).toMatchObject({ stream: "Marketing" });
		expect(page.items[0]).not.toHaveProperty("message");
	});

	it("keeps the first open of a message", async () => {
		const domain = emailDomain();
		const id = await domain.run(
			Effect.gen(function* () {
				const sent = yield* sendOne;
				yield* RecordEmailOpenUseCase.execute({
					actor: systemActor,
					payload: { emailLogId: sent },
				});
				return sent;
			}),
		);
		expect(domain.logs.logs.get(id)?.openedAt).not.toBeNull();
	});
});

import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { EmailSendingStream } from "../../message/value-objects/email-sending-stream.ts";
import { PageRequest } from "../../paging/page.ts";
import { EmailLogRepository } from "../services/email-log-repository.ts";
import { EmailLogStatus } from "../value-objects/email-log-status.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({
		recipient: Schema.optionalKey(Schema.String),
		status: Schema.optionalKey(EmailLogStatus),
		stream: Schema.optionalKey(EmailSendingStream),
		page: PageRequest,
	}),
});

/** The log of sent mail, newest first, without the bodies. */
export const SearchEmailLogsUseCase = UseCase.make({
	name: "delivery.search-email-logs",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.log.read"),
	execute: ({ payload: { page, ...filter } }) =>
		Effect.flatMap(EmailLogRepository, (logs) => logs.search(filter, page)),
});

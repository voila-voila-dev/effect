import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { PageRequest } from "../../paging/page.ts";
import { InboundEmailRepository } from "../services/inbound-email-repository.ts";
import { InboundEmailOutcome } from "../value-objects/inbound-email-outcome.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({
		from: Schema.optionalKey(Schema.String),
		outcome: Schema.optionalKey(InboundEmailOutcome),
		page: PageRequest,
	}),
});

/** The received mail, newest first: `unroutable` is the operators' queue. */
export const SearchInboundEmailsUseCase = UseCase.make({
	name: "inbound.search-inbound-emails",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.inbound.read"),
	execute: ({ payload: { page, ...filter } }) =>
		Effect.flatMap(InboundEmailRepository, (repository) =>
			repository.search(filter, page),
		),
});

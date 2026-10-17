import { UseCase } from "@voila.dev/effect-ddd";
import { Effect, Schema } from "effect";
import { EmailActor } from "../../access/email-actor.ts";
import { operatorWith } from "../../access/email-gates.ts";
import { PageRequest } from "../../paging/page.ts";
import { SuppressionList } from "../services/suppression-list.ts";
import { SuppressionReason } from "../value-objects/suppression-reason.ts";

const Input = Schema.Struct({
	actor: EmailActor,
	payload: Schema.Struct({
		query: Schema.optionalKey(Schema.String),
		reason: Schema.optionalKey(SuppressionReason),
		page: PageRequest,
	}),
});

/** The suppression list, newest first, filtered by a part of the address or a reason. */
export const SearchSuppressedAddressesUseCase = UseCase.make({
	name: "suppression.search-suppressed-addresses",
	input: Input,
	gate: operatorWith<typeof Input.Type>("email.suppression.manage"),
	execute: ({ payload: { page, ...filter } }) =>
		Effect.flatMap(SuppressionList, (suppressions) =>
			suppressions.search(filter, page),
		),
});

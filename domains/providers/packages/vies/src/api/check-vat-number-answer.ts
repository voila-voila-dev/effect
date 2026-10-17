import { Schema } from "effect";

// What the Commission's REST endpoint answers: HTTP 200 for a check and for
// most failures alike, a failure carrying `actionSucceed: false` and a code.

export const CheckAnswer = Schema.Struct({
	valid: Schema.Boolean,
	name: Schema.NullOr(Schema.String),
	address: Schema.NullOr(Schema.String),
	requestDate: Schema.DateTimeUtcFromString,
});

export const FailureAnswer = Schema.Struct({
	actionSucceed: Schema.Literal(false),
	errorWrappers: Schema.Array(
		Schema.Struct({
			error: Schema.String,
			message: Schema.optional(Schema.String),
		}),
	),
});

export type FailureAnswer = typeof FailureAnswer.Type;

export const CheckVatNumberAnswer = Schema.Union([FailureAnswer, CheckAnswer]);

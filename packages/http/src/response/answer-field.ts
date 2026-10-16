import { Schema } from "effect";

/**
 * A field a partner's answer may leave out or send as `null`. Adapters read
 * either as missing, so the decode accepts both rather than failing the call
 * over a partner's serializer habits.
 */
export function answerField<Field extends Schema.Top>(field: Field) {
	return Schema.optionalKey(Schema.NullOr(field));
}

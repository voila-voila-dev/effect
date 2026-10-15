import { Data, Schema } from "effect";

export class NotFound extends Schema.TaggedError<NotFound>()("NotFound", {
	id: Schema.String,
}) {}

export const Shape = Data.TaggedEnum;
export const point = Data.struct({ x: 1, y: 2 });

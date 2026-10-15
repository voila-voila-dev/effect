import { Data } from "effect";

export class NotFound extends Data.TaggedError("NotFound")<{ // fires
	readonly id: string;
}> {}

export class Conflict extends Data.TaggedError("Conflict") {} // fires

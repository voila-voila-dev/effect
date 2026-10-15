import { Context, Effect } from "effect";

export class Ids extends Context.Service<Ids, { readonly next: Effect.Effect<string> }>()(
	"Ids",
) {}

export const id = Effect.flatMap(Ids.asEffect(), (ids) => ids.next);

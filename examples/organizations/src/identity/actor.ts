import { Schema } from "effect";

/**
 * A signed-in user, with the facts the gates decide on resolved once with the
 * session: here, the permissions they hold in each organization.
 */
export class UserActor extends Schema.TaggedClass<UserActor>()("UserActor", {
	userId: Schema.String,
	permissions: Schema.Record(Schema.String, Schema.Array(Schema.String)),
}) {}

/** The process itself: a scheduled job, a webhook. */
export class SystemActor extends Schema.TaggedClass<SystemActor>()(
	"SystemActor",
	{},
) {}

export const Actor = Schema.Union([UserActor, SystemActor]);
export type Actor = typeof Actor.Type;

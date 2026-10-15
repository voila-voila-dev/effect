import { Schema } from "effect";

export class OrganizationNotFoundError extends Schema.TaggedError<OrganizationNotFoundError>()(
	"OrganizationNotFoundError",
	{ organizationId: Schema.String },
) {}

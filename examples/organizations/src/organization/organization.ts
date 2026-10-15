import { Effect, Schema } from "effect";

export class OrganizationNameError extends Schema.TaggedError<OrganizationNameError>()(
	"OrganizationNameError",
	{ name: Schema.String },
) {}

export class Organization extends Schema.Class<Organization>("Organization")({
	id: Schema.String,
	name: Schema.String,
	ownerId: Schema.String,
}) {
	static create(options: { id: string; name: string; ownerId: string }) {
		return validName(options.name).pipe(
			Effect.map((name) => new Organization({ ...options, name })),
		);
	}

	rename(name: string) {
		return validName(name).pipe(
			Effect.map((valid) => new Organization({ ...this, name: valid })),
		);
	}
}

function validName(name: string): Effect.Effect<string, OrganizationNameError> {
	const trimmed = name.trim();
	return trimmed.length >= 2
		? Effect.succeed(trimmed)
		: Effect.fail(new OrganizationNameError({ name }));
}

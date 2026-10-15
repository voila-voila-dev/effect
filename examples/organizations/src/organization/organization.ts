import { Effect, Schema } from "effect";

export class OrganizationNameError extends Schema.TaggedError<OrganizationNameError>()(
	"OrganizationNameError",
	{ name: Schema.String },
) {}

const MINIMUM_NAME_LENGTH = 2;

function validName(name: string): Effect.Effect<string, OrganizationNameError> {
	const trimmed = name.trim();
	return trimmed.length >= MINIMUM_NAME_LENGTH
		? Effect.succeed(trimmed)
		: Effect.fail(new OrganizationNameError({ name }));
}

/** The aggregate: every change goes through a method that keeps its rules. */
export class Organization extends Schema.Class<Organization>("Organization")({
	id: Schema.String,
	name: Schema.String,
	ownerId: Schema.String,
}) {
	static create(options: {
		readonly id: string;
		readonly name: string;
		readonly ownerId: string;
	}) {
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

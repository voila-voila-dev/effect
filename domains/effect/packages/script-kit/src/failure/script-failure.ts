import { Schema } from "effect";

/**
 * The failure a check script ends on. `runScript` renders it and owns the
 * non-zero exit code, so no script calls `process.exit` to report a finding.
 */
export class ScriptFailure extends Schema.TaggedError<ScriptFailure>()(
	"ScriptFailure",
	{ message: Schema.String },
) {}

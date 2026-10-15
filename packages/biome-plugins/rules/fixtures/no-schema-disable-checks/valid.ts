import { Schema } from "effect";

class Email extends Schema.Class<Email>("Email")({ value: Schema.String }) {}

export const email = Email.make({ value: "someone@example.com" });
export const checked = Email.make({ value: "x" }, { disableChecks: false });

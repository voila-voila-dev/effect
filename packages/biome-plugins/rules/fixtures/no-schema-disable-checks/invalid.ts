import { Schema } from "effect";

class Email extends Schema.Class<Email>("Email")({ value: Schema.String }) {}

export const email = Email.make({ value: "not an email" }, { disableChecks: true }); // fires
export const other = new Email({ value: "x" }, { disableChecks: true }); // fires

import { Schema } from "effect";

export const EmailLogId = Schema.String.pipe(Schema.brand("EmailLogId"));

export type EmailLogId = typeof EmailLogId.Type;

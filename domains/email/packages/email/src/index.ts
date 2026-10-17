export {
	consoleEmailSender,
	consoleEmailSenderLayer,
} from "./console/console-email-sender.ts";
export {
	inMemoryEmailSender,
	type SentEmail,
} from "./in-memory/in-memory-email-sender.ts";
export { EmailAddress } from "./message/email-address.ts";
export { EmailAttachment } from "./message/email-attachment.ts";
export { EmailMessage } from "./message/email-message.ts";
export { EmailSendError } from "./sender/email-send-error.ts";
export { EmailSender } from "./sender/email-sender.ts";

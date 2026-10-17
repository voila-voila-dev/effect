export {
	EmailActor,
	EmailOperator,
	EmailSystem,
} from "./access/email-actor.ts";
export {
	operatorWith,
	operatorWithOrSystem,
	system,
} from "./access/email-gates.ts";
export {
	EMAIL_PERMISSIONS,
	EmailPermission,
} from "./access/email-permission.ts";
export { inMemoryEmailLogRepository } from "./delivery/adapters/in-memory-email-log-repository.ts";
export {
	EmailLog,
	type EmailLogFacts,
} from "./delivery/aggregates/email-log.ts";
export { EmailLogNotFoundError } from "./delivery/errors/email-log-not-found-error.ts";
export { EmailDeliveryReportedEvent } from "./delivery/events/email-delivery-reported-event.ts";
export { SUPPRESSED_ADDRESS_REASON } from "./delivery/lib/deliver-claimed-email.ts";
export {
	EmailDeliveryEvent,
	EmailDeliveryOutcome,
} from "./delivery/payloads/email-delivery-event.ts";
export { EmailDeliveryState } from "./delivery/payloads/email-delivery-state.ts";
export type { EmailLogSummary } from "./delivery/payloads/email-log-summary.ts";
export {
	EMAIL_CLAIM_LEASE,
	EMAIL_STREAM_DRAIN_PRIORITY,
	MAXIMUM_DELIVERY_ATTEMPTS,
	nextAttemptAfterFailure,
	SOFT_BOUNCE_SUPPRESSION_THRESHOLD,
} from "./delivery/policies/email-outbox-policy.ts";
export {
	type EmailLogFilter,
	EmailLogRepository,
} from "./delivery/services/email-log-repository.ts";
export * from "./delivery/use-cases/index.ts";
export {
	BOUNCE_KINDS,
	BounceKind,
} from "./delivery/value-objects/bounce-kind.ts";
export { EmailLogId } from "./delivery/value-objects/email-log-id.ts";
export {
	EMAIL_LOG_STATUSES,
	EmailLogStatus,
	REACHED_MAILBOX_STATUSES,
	supersedesEmailLogStatus,
} from "./delivery/value-objects/email-log-status.ts";
export { EmailIds, type EmailIdsShape } from "./ids/email-ids.ts";
export { inMemoryInboundEmailFetcher } from "./inbound/adapters/in-memory-inbound-email-fetcher.ts";
export { inMemoryInboundEmailRepository } from "./inbound/adapters/in-memory-inbound-email-repository.ts";
export { signedReplyAddresses } from "./inbound/adapters/signed-reply-addresses.ts";
export { InboundEmail } from "./inbound/aggregates/inbound-email.ts";
export { InboundEmailFetchError } from "./inbound/errors/inbound-email-fetch-error.ts";
export { InboundEmailNotFoundError } from "./inbound/errors/inbound-email-not-found-error.ts";
export { InvalidReplyTokenError } from "./inbound/errors/invalid-reply-token-error.ts";
export {
	headersLookAutomated,
	senderLooksAutomated,
} from "./inbound/policies/automated-mail.ts";
export {
	isStorableInboundAttachment,
	MAX_INBOUND_ATTACHMENT_BYTES,
	STORABLE_INBOUND_CONTENT_TYPES,
} from "./inbound/policies/inbound-attachment-policy.ts";
export {
	type FetchedInboundAttachment,
	type FetchedInboundContent,
	InboundEmailFetcher,
} from "./inbound/services/inbound-email-fetcher.ts";
export {
	InboundEmailHandler,
	type InboundRoutingOutcome,
} from "./inbound/services/inbound-email-handler.ts";
export {
	type InboundEmailFilter,
	InboundEmailRepository,
} from "./inbound/services/inbound-email-repository.ts";
export {
	InboundEmailSettings,
	type InboundEmailSettingsShape,
} from "./inbound/services/inbound-email-settings.ts";
export {
	ReplyAddresses,
	type ReplyBinding,
} from "./inbound/services/reply-addresses.ts";
export * from "./inbound/use-cases/index.ts";
export {
	EMAIL_AUTHENTICATION_VERDICTS,
	EmailAuthenticationVerdict,
} from "./inbound/value-objects/email-authentication-verdict.ts";
export { InboundEmailAttachment } from "./inbound/value-objects/inbound-email-attachment.ts";
export { InboundEmailId } from "./inbound/value-objects/inbound-email-id.ts";
export {
	INBOUND_EMAIL_OUTCOMES,
	InboundEmailOutcome,
} from "./inbound/value-objects/inbound-email-outcome.ts";
export { normalizeEmailAddress } from "./message/lib/normalize-email-address.ts";
export { EmailAddress } from "./message/value-objects/email-address.ts";
export { EmailAttachment } from "./message/value-objects/email-attachment.ts";
export { EmailMessage } from "./message/value-objects/email-message.ts";
export {
	EMAIL_SENDING_STREAMS,
	EmailSendingStream,
} from "./message/value-objects/email-sending-stream.ts";
export { type Page, PageRequest } from "./paging/page.ts";
export {
	consoleEmailSender,
	consoleEmailSenderLayer,
} from "./sending/adapters/console-email-sender.ts";
export {
	inMemoryEmailSender,
	type SentEmail,
} from "./sending/adapters/in-memory-email-sender.ts";
export { EmailSendError } from "./sending/errors/email-send-error.ts";
export { EmailSender } from "./sending/services/email-sender.ts";
export { inMemorySuppressionList } from "./suppression/adapters/in-memory-suppression-list.ts";
export { SuppressedAddress } from "./suppression/aggregates/suppressed-address.ts";
export {
	type SuppressedAddressFilter,
	SuppressionList,
} from "./suppression/services/suppression-list.ts";
export * from "./suppression/use-cases/index.ts";
export { SuppressedAddressId } from "./suppression/value-objects/suppressed-address-id.ts";
export {
	OPT_OUT_SUPPRESSION_REASONS,
	SUPPRESSION_REASONS,
	SuppressionReason,
} from "./suppression/value-objects/suppression-reason.ts";
export { emailUseCases } from "./use-case-registry.ts";

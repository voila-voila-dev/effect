import {
	OutboundStatusError,
	OutboundTimeoutError,
	OutboundTransportError,
	ResponseDecodeError,
	ResponseTooLargeError,
} from "@voila.dev/http";

/** One line on why a call to Resend failed, with what Resend answered when it did. */
export function describeOutboundFailure(error: unknown): string {
	if (error instanceof OutboundStatusError) {
		return `${error.status}: ${error.body.slice(0, 500)}`;
	}
	if (error instanceof OutboundTimeoutError) {
		return `no answer within ${error.timeoutMilliseconds}ms`;
	}
	if (error instanceof OutboundTransportError) {
		return `request failed: ${String(error.cause)}`;
	}
	if (error instanceof ResponseDecodeError) {
		return `answer did not decode: ${String(error.cause)}`;
	}
	if (error instanceof ResponseTooLargeError) {
		return `answer larger than ${error.maxBytes} bytes`;
	}
	return String(error);
}

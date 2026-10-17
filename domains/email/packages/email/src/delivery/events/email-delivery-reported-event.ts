import { Schema } from "effect";
import { EmailDeliveryEvent } from "../payloads/email-delivery-event.ts";

/**
 * A provider event put on a bus by the webhook route, so a burst of them is
 * recorded by a worker rather than on the API's request pool.
 */
export class EmailDeliveryReportedEvent extends Schema.TaggedClass<EmailDeliveryReportedEvent>()(
	"EmailDeliveryReportedEvent",
	EmailDeliveryEvent.fields,
) {}

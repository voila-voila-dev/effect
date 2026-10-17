import { Effect, Schema } from "effect";
import { Gate } from "../gate/index.ts";
import { permissionRef } from "../permission/permission-ref.ts";
import { UseCase } from "../use-case/use-case.ts";

const Input = Schema.Struct({ payload: Schema.Struct({}) });

function unit(name: string, permission: string) {
	return UseCase.make({
		name,
		input: Input,
		gate: Gate.when<typeof Input.Type>({
			label: permission,
			permissions: [permissionRef("organization", permission)],
			allows: () => true,
		}),
		execute: () => Effect.void,
	});
}

export const createInvoice = unit("billing.create-invoice", "invoice.manage");
export const voidInvoice = unit("billing.void-invoice", "invoice.manage");
export const readReport = unit("reporting.read-report", "report.read");

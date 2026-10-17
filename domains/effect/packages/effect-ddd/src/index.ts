export { AccessDeniedError } from "./access-denied-error.ts";
export { makeAggregateActions } from "./aggregate/aggregate-actions.ts";
export { Gate, gateHolds, type OpenGate } from "./gate/index.ts";
export {
	UNIT_OUTCOME_ATTRIBUTE,
	type UnitKind,
	type UnitMetrics,
	type UnitOutcome,
	unitDuration,
	unitMetrics,
	unitRuns,
} from "./metrics/unit-metrics.ts";
export {
	type PermissionRef,
	permissionRef,
	renderPermissionRef,
} from "./permission/permission-ref.ts";
export {
	checked,
	PERMISSION_CHECKED_ATTRIBUTE,
	splitPermissionChecked,
} from "./permission/permission-tracing.ts";
export { collectUseCases, isUseCase } from "./registry/collect-use-cases.ts";
export {
	permissionCatalogue,
	unknownPermissions,
} from "./registry/permission-catalogue.ts";
export { registryProblems } from "./registry/registry-problems.ts";
export {
	makeUseCaseConstructor,
	type SpanAttributes,
	type UseCaseConstructorOptions,
} from "./use-case/make-use-case.ts";
export {
	type AnyUseCase,
	type UnitInput,
	UseCase,
	type UseCaseDeclaration,
} from "./use-case/use-case.ts";

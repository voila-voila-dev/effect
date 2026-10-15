export { AccessDeniedError } from "./access-denied-error.ts";
export { makeAggregateActions } from "./aggregate-actions.ts";
export { Gate, gateHolds, type OpenGate } from "./gate.ts";
export {
	checked,
	PERMISSION_CHECKED_ATTRIBUTE,
	type PermissionRef,
	permissionRef,
	renderPermissionRef,
	splitPermissionChecked,
} from "./permission-ref.ts";
export {
	collectUseCases,
	isUseCase,
	permissionCatalogue,
	registryProblems,
	unknownPermissions,
} from "./registry.ts";
export {
	UNIT_OUTCOME_ATTRIBUTE,
	type UnitKind,
	type UnitMetrics,
	type UnitOutcome,
	unitDuration,
	unitMetrics,
	unitRuns,
} from "./unit-metrics.ts";
export {
	type AnyUseCase,
	makeUseCaseConstructor,
	type SpanAttributes,
	type UnitInput,
	UseCase,
	type UseCaseConstructorOptions,
} from "./use-case.ts";

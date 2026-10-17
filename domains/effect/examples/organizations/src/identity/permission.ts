import { Schema } from "effect";

export const PERMISSIONS = [
	"organization.manage",
	"organization.read",
] as const;
export const Permission = Schema.Literals(PERMISSIONS);
export type Permission = typeof Permission.Type;

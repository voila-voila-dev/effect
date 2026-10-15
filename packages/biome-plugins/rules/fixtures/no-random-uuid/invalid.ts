import { randomUUID } from "node:crypto";

export const first = crypto.randomUUID(); // fires
export const second = globalThis.crypto.randomUUID(); // fires
export const third = randomUUID(); // fires

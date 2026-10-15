import { collectUseCases } from "@voila.dev/effect-ddd";
import * as organizationUseCases from "./organization/use-cases/index.ts";

/** Every use case the application offers: one line per context's index. */
export const useCases = collectUseCases([organizationUseCases]);

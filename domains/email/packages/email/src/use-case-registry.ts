import { collectUseCases } from "@voila.dev/effect-ddd";
import * as deliveryUseCases from "./delivery/use-cases/index.ts";
import * as suppressionUseCases from "./suppression/use-cases/index.ts";

/** Every use case the email domain offers, for an application's catalogue and its HTTP or RPC layer. */
export const emailUseCases = collectUseCases([
	deliveryUseCases,
	suppressionUseCases,
]);

import { ConfigProvider, type Layer } from "effect";
import { mergeEnvironment } from "./environment-file.ts";

export interface EnvironmentFilesOptions {
	/** The real environment, which always wins over the files. Defaults to `process.env`. */
	readonly env?: Readonly<Record<string, string | undefined>>;
	/** Keep `KEY=` as an explicit empty value instead of a missing one. */
	readonly preserveEmptyStrings?: boolean;
}

/**
 * A `ConfigProvider` over the real environment and the env files, read once
 * and synchronously, so it needs no `FileSystem` service and works the same in
 * Bun, Node and a test. Precedence is `mergeEnvironment`'s: the environment,
 * then each file in order. A missing file is skipped.
 */
export function environmentFilesProvider(
	paths: ReadonlyArray<string>,
	options: EnvironmentFilesOptions = {},
): ConfigProvider.ConfigProvider {
	return ConfigProvider.fromEnvRecord(
		mergeEnvironment(paths, options.env ?? process.env),
		options.preserveEmptyStrings === undefined
			? undefined
			: { preserveEmptyStrings: options.preserveEmptyStrings },
	);
}

/** `environmentFilesProvider` installed as the program's `ConfigProvider`. */
export function environmentFilesLayer(
	paths: ReadonlyArray<string>,
	options: EnvironmentFilesOptions = {},
): Layer.Layer<never> {
	return ConfigProvider.layer(environmentFilesProvider(paths, options));
}

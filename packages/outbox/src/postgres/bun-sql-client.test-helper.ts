import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SQL } from "bun";
import { Effect, Layer, Stream } from "effect";
import { Reactivity } from "effect/reactivity";
import { SqlClient, type SqlConnection, SqlError, Statement } from "effect/sql";

// The tests bring their own driver, Bun's built-in one, so the package ships
// none: an application provides whichever Postgres `SqlClient` it already has.

const escapeIdentifier = Statement.defaultEscape('"');

const compiler = Statement.makeCompiler({
	dialect: "pg",
	placeholder: (index) => `$${index}`,
	onIdentifier: (value, withoutTransform) =>
		withoutTransform ? value : escapeIdentifier(value),
	onRecordUpdate: () => ["", []],
	onCustom: () => ["", []],
});

function toSqlError(cause: unknown, operation: string): SqlError.SqlError {
	return new SqlError.SqlError({
		reason: new SqlError.UnknownError({ cause, operation }),
	});
}

type Reserved = Awaited<ReturnType<SQL["reserve"]>>;

function connection(reserved: Reserved): SqlConnection.Connection {
	const rows = (sql: string, params: ReadonlyArray<unknown>) =>
		Effect.tryPromise({
			try: async (): Promise<ReadonlyArray<Record<string, unknown>>> => [
				...(await reserved.unsafe(sql, [...params])),
			],
			catch: (cause) => toSqlError(cause, sql),
		});
	const values = (sql: string, params: ReadonlyArray<unknown>) =>
		Effect.tryPromise({
			try: async (): Promise<ReadonlyArray<ReadonlyArray<unknown>>> => [
				...(await reserved.unsafe(sql, [...params]).values()),
			],
			catch: (cause) => toSqlError(cause, sql),
		});
	return {
		execute: (sql, params, transform) =>
			Effect.map(rows(sql, params), (result) =>
				transform ? transform(result) : result,
			),
		executeUnprepared: (sql, params, transform) =>
			Effect.map(rows(sql, params), (result) =>
				transform ? transform(result) : result,
			),
		executeRaw: rows,
		executeValues: values,
		executeValuesUnprepared: values,
		executeStream: (sql, params) =>
			Stream.unwrap(Effect.map(rows(sql, params), Stream.fromIterable)),
	};
}

export function bunSqlClientLayer(
	url: string,
): Layer.Layer<SqlClient.SqlClient> {
	return Layer.effect(
		SqlClient.SqlClient,
		Effect.gen(function* () {
			const pool = yield* Effect.acquireRelease(
				Effect.sync(() => new SQL(url)),
				(sql) => Effect.promise(() => sql.close()),
			);
			const acquirer: SqlConnection.Acquirer = Effect.acquireRelease(
				Effect.tryPromise({
					try: () => pool.reserve(),
					catch: (cause) => toSqlError(cause, "connect"),
				}),
				(reserved) => Effect.sync(() => reserved.release()),
			).pipe(Effect.map(connection));
			return yield* SqlClient.make({ acquirer, compiler, spanAttributes: [] });
		}),
	).pipe(Layer.provide(Reactivity.layer), Layer.orDie);
}

/** The migration as shipped, applied to a schema of its own so the tests leave nothing behind. */
export const outboxMigration = readFileSync(
	join(import.meta.dirname, "../../migrations/0001_create_outbox.sql"),
	"utf8",
);

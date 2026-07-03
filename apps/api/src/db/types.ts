import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

export type Queryable = Pick<Pool | PoolClient, "query">;

export async function queryOne<T extends QueryResultRow>(
  db: Queryable,
  text: string,
  values: unknown[] = [],
): Promise<T | undefined> {
  const result: QueryResult<T> = await db.query(text, values);
  return result.rows[0];
}

export async function queryMany<T extends QueryResultRow>(
  db: Queryable,
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result: QueryResult<T> = await db.query(text, values);
  return result.rows;
}

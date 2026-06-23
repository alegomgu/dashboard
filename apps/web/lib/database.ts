import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  sqlClient ??= postgres(databaseUrl, {
    max: 1,
    prepare: false,
  });

  return sqlClient;
}

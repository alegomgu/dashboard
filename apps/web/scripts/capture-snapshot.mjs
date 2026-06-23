const baseUrl = process.env.DASHBOARD_BASE_URL ?? "http://localhost:3000";
const watch = process.argv.includes("--watch");
const minutesArg = process.argv.find((arg) => arg.startsWith("--minutes="));
const intervalMinutes = Number(
  minutesArg?.split("=").at(1) ?? process.env.SNAPSHOT_INTERVAL_MINUTES ?? "15",
);

async function captureSnapshot() {
  const response = await fetch(new URL("/api/snapshots/capture", baseUrl), {
    method: "POST",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Snapshot capture failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const summary = rows
    .map((row) => `${row.accountName}:${row.equity ?? "n/a"}`)
    .join(" ");
  console.log(
    `[${new Date().toISOString()}] snapshot ok points=${payload.health?.totalSnapshots ?? "n/a"} ${summary}`,
  );
}

async function main() {
  await captureSnapshot();

  if (watch && intervalMinutes > 0) {
    const intervalMs = intervalMinutes * 60 * 1000;
    console.log(
      `Watching snapshots every ${intervalMinutes} min against ${baseUrl}`,
    );
    setInterval(() => {
      captureSnapshot().catch((error) => {
        console.error(
          `[${new Date().toISOString()}] snapshot error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }, intervalMs);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

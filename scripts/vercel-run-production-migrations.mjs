import { spawnSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.VERCEL_ENV === "production";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!isVercel || !isProduction) {
  console.log("Skipping database migrations outside Vercel production.");
  process.exit(0);
}

if (!hasDatabaseUrl) {
  console.error("DATABASE_URL is required to run production migrations.");
  process.exit(1);
}

console.log("Running Drizzle migrations for Vercel production...");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["run", "db:migrate"], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

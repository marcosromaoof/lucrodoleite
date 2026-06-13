import type { getDb } from "@/db/client";

export type AppDatabase = ReturnType<typeof getDb>;

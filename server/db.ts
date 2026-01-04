import path from "path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const { Pool } = pg;

// Use NEON_DATABASE_URL first (for Railway), then fall back to DATABASE_URL (for local dev)
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

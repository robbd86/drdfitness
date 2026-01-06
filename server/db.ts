import path from "path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// Import only Drizzle table definitions and relations, NOT Zod schemas or types
import {
  workouts,
  workoutDays,
  exercises,
  workoutLogs,
  workoutSessions,
  exerciseLibrary,
  scheduledWorkouts,
  workoutsRelations,
  workoutDaysRelations,
  exercisesRelations,
} from "@shared/schema";

import { users, sessions } from "./db/schema/auth";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const { Pool } = pg;

// Prefer DATABASE_URL (Drizzle/Railway standard), fall back to NEON_DATABASE_URL.
const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });

// Only pass table definitions and relations to Drizzle schema
export const db = drizzle(pool, {
  schema: {
    workouts,
    workoutDays,
    exercises,
    workoutLogs,
    workoutSessions,
    exerciseLibrary,
    scheduledWorkouts,
    workoutsRelations,
    workoutDaysRelations,
    exercisesRelations,
    users,
    sessions,
  },
});

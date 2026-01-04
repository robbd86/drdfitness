// shared/schema.ts
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { z } from "zod";

/* ----------------------------- Tables ----------------------------- */

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workoutDays = pgTable("workout_days", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id").notNull(),
  name: text("name").notNull(),
  sets: integer("sets"),
  reps: integer("reps"),
  weight: integer("weight"),
  notes: text("notes"),
  order: integer("order").notNull(),
  completed: boolean("completed").default(false),
  useCustomSets: boolean("use_custom_sets").default(false),
  setData: jsonb("set_data"),
});

export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  workoutName: text("workout_name").notNull(),
  dayName: text("day_name").notNull(),
  exerciseId: integer("exercise_id"),
  exerciseName: text("exercise_name").notNull(),
  sets: integer("sets"),
  reps: integer("reps"),
  weight: integer("weight"),
  totalVolume: integer("total_volume"),
  setData: jsonb("set_data"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

/* ----------------------------- Base Schemas ----------------------------- */

export const workoutSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const workoutDaySchema = z.object({
  id: z.number(),
  workoutId: z.number(),
  name: z.string(),
  order: z.number(),
});

export const exerciseSchema = z.object({
  id: z.number(),
  dayId: z.number(),
  name: z.string(),
  sets: z.number().nullable(),
  reps: z.number().nullable(),
  weight: z.number().nullable(),
  notes: z.string().nullable(),
  order: z.number(),
  completed: z.boolean(),
  useCustomSets: z.boolean(),
  setData: z.any().nullable(),
});

export const workoutLogSchema = z.object({
  id: z.number(),
  workoutId: z.number(),
  workoutName: z.string(),
  dayName: z.string(),
  exerciseId: z.number().nullable(),
  exerciseName: z.string(),
  sets: z.number().nullable(),
  reps: z.number().nullable(),
  weight: z.number().nullable(),
  totalVolume: z.number().nullable(),
  setData: z.any().nullable(),
  completedAt: z.coerce.date(),
});

/* ----------------------------- Insert Schemas ----------------------------- */

export const insertWorkoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const insertDaySchema = z.object({
  name: z.string().min(1),
  order: z.number(),
});

export const insertExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  order: z.number(),
  useCustomSets: z.boolean().optional(),
  setData: z.any().nullable().optional(),
});

/* ----------------------------- Compound ----------------------------- */

export const workoutWithDaysSchema = workoutSchema.extend({
  days: z.array(
    workoutDaySchema.extend({
      exercises: z.array(exerciseSchema),
    })
  ),
});

/* ----------------------------- Types ----------------------------- */

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type InsertDay = z.infer<typeof insertDaySchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;



// shared/schema.ts
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";

/* ----------------------------- Tables ----------------------------- */

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  // Nullable for safer rollout; new workouts will always set it.
  userId: text("user_id"),
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
  weight: real("weight"),
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
  weight: real("weight"),
  totalVolume: integer("total_volume"),
  setData: jsonb("set_data"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  sessionId: integer("session_id"),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  dayId: integer("day_id").notNull(),
  workoutName: text("workout_name").notNull(),
  dayName: text("day_name").notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  durationMinutes: integer("duration_minutes"),
  totalVolume: integer("total_volume"),
  exerciseCount: integer("exercise_count"),
});

export const exerciseLibrary = pgTable("exercise_library", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  equipment: text("equipment"),
  isCustom: boolean("is_custom").default(false),
});

export const scheduledWorkouts = pgTable("scheduled_workouts", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  dayId: integer("day_id").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completed: boolean("completed").default(false),
  notes: text("notes"),
});

export const scheduledWorkoutSchema = z.object({
  id: z.number(),
  workoutId: z.number(),
  dayId: z.number(),
  scheduledDate: z.coerce.date(),
  completed: z.boolean(),
  notes: z.string().nullable(),
});

export const exerciseLibrarySchema = z.object({
  id: z.number(),
  name: z.string(),
  muscleGroup: z.string(),
  equipment: z.string().nullable(),
  isCustom: z.boolean(),
});

/* ----------------------------- Relations ----------------------------- */

export const workoutsRelations = relations(workouts, ({ many }) => ({
  days: many(workoutDays),
}));

export const workoutDaysRelations = relations(workoutDays, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutDays.workoutId],
    references: [workouts.id],
  }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  day: one(workoutDays, {
    fields: [exercises.dayId],
    references: [workoutDays.id],
  }),
}));

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
  sessionId: z.number().nullable().optional(),
});

export const workoutSessionSchema = z.object({
  id: z.number(),
  workoutId: z.number(),
  dayId: z.number(),
  workoutName: z.string(),
  dayName: z.string(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
  durationMinutes: z.number().nullable(),
  totalVolume: z.number().nullable(),
  exerciseCount: z.number().nullable(),
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
export type Workout = z.infer<typeof workoutSchema>;
export type WorkoutDay = z.infer<typeof workoutDaySchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type WorkoutWithDays = z.infer<typeof workoutWithDaysSchema>;
export type Day = WorkoutWithDays["days"][number];
export type WorkoutLog = z.infer<typeof workoutLogSchema>;
export type WorkoutSession = z.infer<typeof workoutSessionSchema>;
export type ExerciseLibraryItem = z.infer<typeof exerciseLibrarySchema>;
export type ScheduledWorkout = z.infer<typeof scheduledWorkoutSchema>;



import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutDays = pgTable("workout_days", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  order: integer("order").notNull().default(0),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id").notNull(),
  name: text("name").notNull(),
  sets: integer("sets").notNull().default(3),
  reps: integer("reps").notNull().default(10),
  weight: real("weight"),
  notes: text("notes"),
  order: integer("order").notNull().default(0),
  completed: boolean("completed").default(false),
  // Each set can have its own weight and reps if needed
  // Format: [{weight: number, reps: number, completed: boolean}]
  setData: jsonb("set_data").$type<{ weight: number; reps: number; completed: boolean }[]>(),
  useCustomSets: boolean("use_custom_sets").default(false),
});

// Relations
export const workoutsRelations = relations(workouts, ({ many }) => ({
  days: many(workoutDays),
}));

export const daysRelations = relations(workoutDays, ({ one, many }) => ({
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

// Schemas
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true, createdAt: true });
export const insertDaySchema = createInsertSchema(workoutDays).omit({ id: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });

// Types
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type WorkoutDay = typeof workoutDays.$inferSelect;
export type InsertDay = z.infer<typeof insertDaySchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  workouts, workoutDays, exercises,
  type Workout, type InsertWorkout,
  type WorkoutDay, type InsertDay,
  type Exercise, type InsertExercise
} from "@shared/schema";

export interface IStorage {
  // Workouts
  getWorkouts(): Promise<(Workout & { days: (WorkoutDay & { exercises: Exercise[] })[] })[]>;
  getWorkout(id: number): Promise<(Workout & { days: (WorkoutDay & { exercises: Exercise[] })[] }) | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  deleteWorkout(id: number): Promise<void>;

  // Days
  createDay(day: InsertDay): Promise<WorkoutDay>;
  deleteDay(id: number): Promise<void>;

  // Exercises
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, updates: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getWorkouts() {
    return await db.query.workouts.findMany({
      with: {
        days: {
          with: {
            exercises: {
              orderBy: (exercises, { asc }) => [asc(exercises.id)],
            }
          },
          orderBy: (days, { asc }) => [asc(days.id)],
        },
      },
      orderBy: (workouts, { desc }) => [desc(workouts.createdAt)],
    });
  }

  async getWorkout(id: number) {
    return await db.query.workouts.findFirst({
      where: eq(workouts.id, id),
      with: {
        days: {
          with: {
            exercises: {
              orderBy: (exercises, { asc }) => [asc(exercises.id)],
            }
          },
          orderBy: (days, { asc }) => [asc(days.id)],
        },
      },
    });
  }

  async createWorkout(workout: InsertWorkout) {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async deleteWorkout(id: number) {
    await db.delete(workouts).where(eq(workouts.id, id));
  }

  async createDay(day: InsertDay) {
    const [newDay] = await db.insert(workoutDays).values(day).returning();
    return newDay;
  }

  async deleteDay(id: number) {
    await db.delete(workoutDays).where(eq(workoutDays.id, id));
  }

  async createExercise(exercise: InsertExercise) {
    // Get max order
    const existing = await db.query.exercises.findMany({
      where: eq(exercises.dayId, exercise.dayId),
    });
    const maxOrder = existing.length > 0 ? Math.max(...existing.map(e => e.order)) : -1;
    
    const [newExercise] = await db.insert(exercises).values({
      ...exercise,
      order: maxOrder + 1,
    }).returning();
    return newExercise;
  }

  async updateExercise(id: number, updates: Partial<InsertExercise>) {
    const [updated] = await db.update(exercises)
      .set(updates)
      .where(eq(exercises.id, id))
      .returning();
    return updated;
  }

  async deleteExercise(id: number) {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async reorderExercises(dayId: number, exerciseIds: number[]) {
    await db.transaction(async (tx) => {
      for (let i = 0; i < exerciseIds.length; i++) {
        await tx.update(exercises)
          .set({ order: i })
          .where(eq(exercises.id, exerciseIds[i]));
      }
    });
  }
}

export const storage = new DatabaseStorage();

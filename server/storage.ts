// server/storage.ts
import { db } from "./db";
import {
  workouts,
  workoutDays,
  exercises,
  workoutLogs,
  type InsertWorkout,
  type InsertDay,
  type InsertExercise,
} from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

/* ----------------------------- Validation ----------------------------- */

const setDataSchema = z
  .array(
    z
      .object({
        reps: z.number().optional(),
        weight: z.number().optional(),
        completed: z.boolean().optional(),
      })
      .passthrough()
  )
  .optional();

/* ----------------------------- Workouts ----------------------------- */

export async function listWorkouts() {
  return db.select().from(workouts);
}

export async function getWorkout(id: number) {
  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, id),
    with: {
      days: {
        orderBy: (d, { asc }) => [asc(d.order)],
        with: {
          exercises: {
            orderBy: (e, { asc }) => [asc(e.order)],
          },
        },
      },
    },
  });

  return workout ?? null;
}

export async function createWorkout(data: InsertWorkout) {
  const [workout] = await db.insert(workouts).values(data).returning();
  return workout;
}

export async function deleteWorkout(id: number) {
  await db.delete(workouts).where(eq(workouts.id, id));
}

/* ----------------------------- Days ----------------------------- */

export async function createDay(workoutId: number, data: InsertDay) {
  const [day] = await db
    .insert(workoutDays)
    .values({ ...data, workoutId })
    .returning();
  return day;
}

export async function deleteDay(id: number) {
  await db.delete(workoutDays).where(eq(workoutDays.id, id));
}

export async function duplicateDay(id: number) {
  return db.transaction(async (tx) => {
    const day = await tx.query.workoutDays.findFirst({
      where: eq(workoutDays.id, id),
      with: {
        exercises: true,
      },
    });

    if (!day) throw new Error("Day not found");

    const [newDay] = await tx
      .insert(workoutDays)
      .values({
        workoutId: day.workoutId,
        name: `${day.name} (Copy)`,
        order: day.order + 1,
      })
      .returning();

    if (day.exercises.length) {
      await tx.insert(exercises).values(
        day.exercises.map((e) => ({
          dayId: newDay.id,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          notes: e.notes,
          order: e.order,
          useCustomSets: e.useCustomSets,
          setData: e.setData,
        }))
      );
    }

    return newDay;
  });
}

/* ----------------------------- Exercises ----------------------------- */

export async function createExercise(dayId: number, data: InsertExercise) {
  setDataSchema.parse(data.setData);

  const [exercise] = await db
    .insert(exercises)
    .values({ ...data, dayId })
    .returning();

  return exercise;
}

export async function updateExercise(id: number, updates: Partial<InsertExercise>) {
  if ("setData" in updates) {
    setDataSchema.parse(updates.setData);
  }

  const [exercise] = await db
    .update(exercises)
    .set(updates)
    .where(eq(exercises.id, id))
    .returning();

  return exercise;
}

export async function deleteExercise(id: number) {
  await db.delete(exercises).where(eq(exercises.id, id));
}

export async function reorderExercises(dayId: number, exerciseIds: number[]) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.dayId, dayId));

    const validIds = new Set(existing.map((e) => e.id));

    exerciseIds.forEach((id) => {
      if (!validIds.has(id)) {
        throw new Error("Invalid exercise ID in reorder list");
      }
    });

    for (let i = 0; i < exerciseIds.length; i++) {
      await tx
        .update(exercises)
        .set({ order: i })
        .where(eq(exercises.id, exerciseIds[i]));
    }
  });
}

/* ----------------------------- Progress / Logs ----------------------------- */

export async function logCompletedDay(workoutId: number, dayId: number) {
  return db.transaction(async (tx) => {
    const workout = await tx.query.workouts.findFirst({
      where: eq(workouts.id, workoutId),
    });

    const day = await tx.query.workoutDays.findFirst({
      where: eq(workoutDays.id, dayId),
      with: {
        exercises: true,
      },
    });

    if (!workout || !day) throw new Error("Workout or day not found");

    const now = new Date();

    if (day.exercises.length) {
      await tx.insert(workoutLogs).values(
        day.exercises.map((e) => ({
          workoutId,
          workoutName: workout.name,
          dayName: day.name,
          exerciseId: e.id,
          exerciseName: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          setData: e.setData,
          totalVolume:
            e.setData?.reduce(
              (sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0),
              0
            ) ?? null,
          completedAt: now,
        }))
      );
    }

    await tx
      .update(exercises)
      .set({ completed: true })
      .where(eq(exercises.dayId, dayId));
  });
}

/* ----------------------------- Data Management ----------------------------- */

export async function exportData() {
  const [allWorkouts, allDays, allExercises, allLogs] = await Promise.all([
    db.select().from(workouts),
    db.select().from(workoutDays),
    db.select().from(exercises),
    db.select().from(workoutLogs),
  ]);

  return {
    workouts: allWorkouts,
    days: allDays,
    exercises: allExercises,
    logs: allLogs,
  };
}

export async function importData(
  data: {
    workouts: InsertWorkout[];
    days: InsertDay[];
    exercises: InsertExercise[];
    logs?: any[];
  },
  replaceExisting: boolean
) {
  return db.transaction(async (tx) => {
    if (replaceExisting) {
      await tx.delete(workoutLogs);
      await tx.delete(exercises);
      await tx.delete(workoutDays);
      await tx.delete(workouts);
    }

    if (data.workouts?.length) await tx.insert(workouts).values(data.workouts);
    if (data.days?.length) await tx.insert(workoutDays).values(data.days);
    if (data.exercises?.length) await tx.insert(exercises).values(data.exercises);
    if (data.logs?.length) await tx.insert(workoutLogs).values(data.logs);
  });
}

export async function resetData() {
  return db.transaction(async (tx) => {
    await tx.delete(workoutLogs);
    await tx.delete(exercises);
    await tx.delete(workoutDays);
    await tx.delete(workouts);
  });
}

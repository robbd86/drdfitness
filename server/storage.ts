// server/storage.ts
import { db } from "./db";
import {
  workouts,
  workoutDays,
  exercises,
  workoutLogs,
  exerciseLibrary,
  workoutSessions,
  scheduledWorkouts,
  type InsertWorkout,
  type InsertDay,
  type InsertExercise,
} from "@shared/schema";
import { eq, inArray, ilike, desc, and, gte, lte } from "drizzle-orm";
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

type SetDataEntry = { reps?: number; weight?: number; completed?: boolean };

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

export async function reorderDays(workoutId: number, dayIds: number[]) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: workoutDays.id })
      .from(workoutDays)
      .where(eq(workoutDays.workoutId, workoutId));

    const validIds = new Set(existing.map((d) => d.id));

    dayIds.forEach((id) => {
      if (!validIds.has(id)) {
        throw new Error("Invalid day ID in reorder list");
      }
    });

    for (let i = 0; i < dayIds.length; i++) {
      await tx
        .update(workoutDays)
        .set({ order: i })
        .where(eq(workoutDays.id, dayIds[i]));
    }
  });
}

/* ----------------------------- Progress / Logs ----------------------------- */

export async function logCompletedDay(workoutId: number, dayId: number, startedAt?: Date) {
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
    const sessionStart = startedAt || now;
    const durationMinutes = Math.round((now.getTime() - sessionStart.getTime()) / 60000);

    // Calculate total volume for the session
    const totalSessionVolume = day.exercises.reduce((sum, e) => {
      const sd = e.setData as SetDataEntry[] | null | undefined;
      const exerciseVolume = sd?.reduce(
        (s: number, set: SetDataEntry) => s + (set.reps ?? 0) * (set.weight ?? 0),
        0
      ) ?? 0;
      return sum + exerciseVolume;
    }, 0);

    // Create workout session
    const [session] = await tx.insert(workoutSessions).values({
      workoutId,
      dayId,
      workoutName: workout.name,
      dayName: day.name,
      startedAt: sessionStart,
      completedAt: now,
      durationMinutes,
      totalVolume: totalSessionVolume,
      exerciseCount: day.exercises.length,
    }).returning();

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
            (e.setData as SetDataEntry[] | null | undefined)?.reduce(
              (sum: number, s: SetDataEntry) => sum + (s.reps ?? 0) * (s.weight ?? 0),
              0
            ) ?? null,
          completedAt: now,
          sessionId: session.id,
        }))
      );
    }

    await tx
      .update(exercises)
      .set({ completed: true })
      .where(eq(exercises.dayId, dayId));

    return session;
  });
}

export async function getWorkoutSessions() {
  return db.select().from(workoutSessions).orderBy(desc(workoutSessions.completedAt));
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
    workouts?: any[];
    days?: any[];
    exercises?: any[];
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

/* ----------------------------- Exercise Library ----------------------------- */

export async function listExerciseLibrary() {
  return db.select().from(exerciseLibrary);
}

export async function searchExerciseLibrary(query: string) {
  return db
    .select()
    .from(exerciseLibrary)
    .where(ilike(exerciseLibrary.name, `%${query}%`))
    .limit(20);
}

export async function createExerciseLibraryItem(data: {
  name: string;
  muscleGroup: string;
  equipment?: string;
  isCustom?: boolean;
}) {
  const [item] = await db
    .insert(exerciseLibrary)
    .values({ ...data, isCustom: data.isCustom ?? true })
    .returning();
  return item;
}

export async function seedExerciseLibrary() {
  const existing = await db.select().from(exerciseLibrary).limit(1);
  if (existing.length > 0) return; // Already seeded

  const defaultExercises = [
    // Chest
    { name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
    { name: "Incline Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
    { name: "Dumbbell Fly", muscleGroup: "Chest", equipment: "Dumbbells" },
    { name: "Cable Crossover", muscleGroup: "Chest", equipment: "Cable" },
    { name: "Push-ups", muscleGroup: "Chest", equipment: "Bodyweight" },
    { name: "Chest Dips", muscleGroup: "Chest", equipment: "Bodyweight" },
    // Back
    { name: "Deadlift", muscleGroup: "Back", equipment: "Barbell" },
    { name: "Bent Over Row", muscleGroup: "Back", equipment: "Barbell" },
    { name: "Pull-ups", muscleGroup: "Back", equipment: "Bodyweight" },
    { name: "Lat Pulldown", muscleGroup: "Back", equipment: "Cable" },
    { name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable" },
    { name: "T-Bar Row", muscleGroup: "Back", equipment: "Barbell" },
    { name: "Dumbbell Row", muscleGroup: "Back", equipment: "Dumbbells" },
    // Shoulders
    { name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell" },
    { name: "Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbells" },
    { name: "Front Raise", muscleGroup: "Shoulders", equipment: "Dumbbells" },
    { name: "Face Pull", muscleGroup: "Shoulders", equipment: "Cable" },
    { name: "Arnold Press", muscleGroup: "Shoulders", equipment: "Dumbbells" },
    { name: "Reverse Fly", muscleGroup: "Shoulders", equipment: "Dumbbells" },
    // Legs
    { name: "Squat", muscleGroup: "Legs", equipment: "Barbell" },
    { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine" },
    { name: "Romanian Deadlift", muscleGroup: "Legs", equipment: "Barbell" },
    { name: "Lunges", muscleGroup: "Legs", equipment: "Dumbbells" },
    { name: "Leg Curl", muscleGroup: "Legs", equipment: "Machine" },
    { name: "Leg Extension", muscleGroup: "Legs", equipment: "Machine" },
    { name: "Calf Raises", muscleGroup: "Legs", equipment: "Machine" },
    { name: "Hip Thrust", muscleGroup: "Legs", equipment: "Barbell" },
    // Arms
    { name: "Barbell Curl", muscleGroup: "Arms", equipment: "Barbell" },
    { name: "Hammer Curl", muscleGroup: "Arms", equipment: "Dumbbells" },
    { name: "Tricep Pushdown", muscleGroup: "Arms", equipment: "Cable" },
    { name: "Skull Crusher", muscleGroup: "Arms", equipment: "Barbell" },
    { name: "Preacher Curl", muscleGroup: "Arms", equipment: "Barbell" },
    { name: "Overhead Tricep Extension", muscleGroup: "Arms", equipment: "Dumbbells" },
    // Core
    { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight" },
    { name: "Hanging Leg Raise", muscleGroup: "Core", equipment: "Bodyweight" },
    { name: "Cable Crunch", muscleGroup: "Core", equipment: "Cable" },
    { name: "Russian Twist", muscleGroup: "Core", equipment: "Bodyweight" },
    { name: "Ab Wheel Rollout", muscleGroup: "Core", equipment: "Ab Wheel" },
  ];

  await db.insert(exerciseLibrary).values(
    defaultExercises.map((e) => ({ ...e, isCustom: false }))
  );
}

/* ----------------------------- Logs by Exercise ----------------------------- */

export async function getLogsByExerciseName(exerciseName: string) {
  return db
    .select()
    .from(workoutLogs)
    .where(eq(workoutLogs.exerciseName, exerciseName))
    .orderBy(desc(workoutLogs.completedAt));
}

/* ----------------------------- Scheduled Workouts ----------------------------- */

export async function listScheduledWorkouts() {
  return db.select().from(scheduledWorkouts).orderBy(scheduledWorkouts.scheduledDate);
}

export async function getTodaySchedule() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return db
    .select()
    .from(scheduledWorkouts)
    .where(
      and(
        gte(scheduledWorkouts.scheduledDate, today),
        lte(scheduledWorkouts.scheduledDate, tomorrow)
      )
    );
}

export async function createScheduledWorkout(data: {
  workoutId: number;
  dayId: number;
  scheduledDate: Date;
  notes?: string;
}) {
  const [scheduled] = await db
    .insert(scheduledWorkouts)
    .values(data)
    .returning();
  return scheduled;
}

export async function deleteScheduledWorkout(id: number) {
  await db.delete(scheduledWorkouts).where(eq(scheduledWorkouts.id, id));
}

export async function markScheduledWorkoutComplete(id: number) {
  const [scheduled] = await db
    .update(scheduledWorkouts)
    .set({ completed: true })
    .where(eq(scheduledWorkouts.id, id))
    .returning();
  return scheduled;
}

// server/routes.ts
import { Router } from "express";
import {
  listWorkouts,
  getWorkout,
  createWorkout,
  deleteWorkout,
  createDay,
  deleteDay,
  duplicateDay,
  createExercise,
  updateExercise,
  deleteExercise,
  reorderExercises,
  logCompletedDay,
  exportData,
  importData,
  resetData,
} from "./storage";

import {
  insertWorkoutSchema,
  insertDaySchema,
  insertExerciseSchema,
} from "@shared/schema";

const router = Router();

/* ----------------------------- Workouts ----------------------------- */

router.get("/workouts", async (_req, res, next) => {
  try {
    res.json(await listWorkouts());
  } catch (err) {
    next(err);
  }
});

router.get("/workouts/:id", async (req, res, next) => {
  try {
    const workout = await getWorkout(Number(req.params.id));
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json(workout);
  } catch (err) {
    next(err);
  }
});

router.post("/workouts", async (req, res, next) => {
  try {
    const data = insertWorkoutSchema.parse(req.body);
    const workout = await createWorkout(data);
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
});

router.delete("/workouts/:id", async (req, res, next) => {
  try {
    await deleteWorkout(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Days ----------------------------- */

router.post("/workouts/:workoutId/days", async (req, res, next) => {
  try {
    const data = insertDaySchema.parse(req.body);
    const day = await createDay(Number(req.params.workoutId), data);
    res.status(201).json(day);
  } catch (err) {
    next(err);
  }
});

router.delete("/days/:id", async (req, res, next) => {
  try {
    await deleteDay(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/days/:id/duplicate", async (req, res, next) => {
  try {
    const day = await duplicateDay(Number(req.params.id));
    res.status(201).json(day);
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Exercises ----------------------------- */

router.post("/days/:dayId/exercises", async (req, res, next) => {
  try {
    const data = insertExerciseSchema.parse(req.body);
    const exercise = await createExercise(Number(req.params.dayId), data);
    res.status(201).json(exercise);
  } catch (err) {
    next(err);
  }
});

router.patch("/exercises/:id", async (req, res, next) => {
  try {
    const exercise = await updateExercise(Number(req.params.id), req.body);
    res.json(exercise);
  } catch (err) {
    next(err);
  }
});

router.delete("/exercises/:id", async (req, res, next) => {
  try {
    await deleteExercise(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/days/:dayId/exercises/reorder", async (req, res, next) => {
  try {
    await reorderExercises(Number(req.params.dayId), req.body.exerciseIds);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Progress / Logs ----------------------------- */

router.post(
  "/workouts/:workoutId/days/:dayId/complete",
  async (req, res, next) => {
    try {
      await logCompletedDay(
        Number(req.params.workoutId),
        Number(req.params.dayId)
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

/* ----------------------------- Data ----------------------------- */

router.get("/logs", async (_req, res, next) => {
  try {
    const data = await exportData();
    res.json(data.logs);
  } catch (err) {
    next(err);
  }
});

router.get("/data/export", async (_req, res, next) => {
  try {
    res.json(await exportData());
  } catch (err) {
    next(err);
  }
});

router.post("/data/import", async (req, res, next) => {
  try {
    const { replaceExisting, ...data } = req.body;
    await importData(data, Boolean(replaceExisting));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/data/reset", async (_req, res, next) => {
  try {
    await resetData();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;


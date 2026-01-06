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
  reorderDays,
  logCompletedDay,
  exportData,
  importData,
  resetData,
  listExerciseLibrary,
  searchExerciseLibrary,
  createExerciseLibraryItem,
  getLogsByExerciseName,
  getWorkoutSessions,
  listScheduledWorkouts,
  getTodaySchedule,
  createScheduledWorkout,
  deleteScheduledWorkout,
} from "./storage";

import {
  insertWorkoutSchema,
  insertDaySchema,
  insertExerciseSchema,
} from "@shared/schema";

import { requireAuth } from "./middleware/requireAuth";

const router = Router();

// Example protection: all /api/workouts* routes require a logged-in session.
router.use("/workouts", requireAuth);

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

router.post("/workouts/:workoutId/days/reorder", async (req, res, next) => {
  try {
    await reorderDays(Number(req.params.workoutId), req.body.dayIds);
    res.json({ success: true });
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
      const startedAt = req.body.startedAt ? new Date(req.body.startedAt) : undefined;
      const session = await logCompletedDay(
        Number(req.params.workoutId),
        Number(req.params.dayId),
        startedAt
      );
      res.status(200).json(session);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/sessions", async (_req, res, next) => {
  try {
    res.json(await getWorkoutSessions());
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Data ----------------------------- */

router.get("/logs", async (_req, res, next) => {
  try {
    const data = await exportData();
    res.json(data.logs);
  } catch (err) {
    next(err);
  }
});

router.get("/logs/exercise/:name", async (req, res, next) => {
  try {
    const logs = await getLogsByExerciseName(decodeURIComponent(req.params.name));
    res.json(logs);
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

/* ----------------------------- Exercise Library ----------------------------- */

router.get("/exercise-library", async (_req, res, next) => {
  try {
    res.json(await listExerciseLibrary());
  } catch (err) {
    next(err);
  }
});

router.get("/exercise-library/search", async (req, res, next) => {
  try {
    const query = String(req.query.q || "");
    res.json(await searchExerciseLibrary(query));
  } catch (err) {
    next(err);
  }
});

router.post("/exercise-library", async (req, res, next) => {
  try {
    const item = await createExerciseLibraryItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Schedule ----------------------------- */

router.get("/schedule", async (_req, res, next) => {
  try {
    res.json(await listScheduledWorkouts());
  } catch (err) {
    next(err);
  }
});

router.get("/schedule/today", async (_req, res, next) => {
  try {
    res.json(await getTodaySchedule());
  } catch (err) {
    next(err);
  }
});

router.post("/schedule", async (req, res, next) => {
  try {
    const scheduled = await createScheduledWorkout({
      workoutId: req.body.workoutId,
      dayId: req.body.dayId,
      scheduledDate: new Date(req.body.scheduledDate),
      notes: req.body.notes,
    });
    res.status(201).json(scheduled);
  } catch (err) {
    next(err);
  }
});

router.delete("/schedule/:id", async (req, res, next) => {
  try {
    await deleteScheduledWorkout(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;


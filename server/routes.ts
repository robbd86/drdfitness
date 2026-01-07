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

// All API routes below require a logged-in session.
router.use(requireAuth);

/* ----------------------------- Workouts ----------------------------- */

router.get("/workouts", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(await listWorkouts(userId));
  } catch (err) {
    next(err);
  }
});

router.get("/workouts/:id", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const workout = await getWorkout(userId, Number(req.params.id));
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json(workout);
  } catch (err) {
    next(err);
  }
});

router.post("/workouts", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = insertWorkoutSchema.parse(req.body);
    const workout = await createWorkout(userId, data);
    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
});

router.delete("/workouts/:id", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await deleteWorkout(userId, Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Days ----------------------------- */

router.post("/workouts/:workoutId/days", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = insertDaySchema.parse(req.body);
    const day = await createDay(userId, Number(req.params.workoutId), data);
    res.status(201).json(day);
  } catch (err) {
    next(err);
  }
});

router.delete("/days/:id", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await deleteDay(userId, Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/days/:id/duplicate", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const day = await duplicateDay(userId, Number(req.params.id));
    res.status(201).json(day);
  } catch (err) {
    next(err);
  }
});

router.post("/workouts/:workoutId/days/reorder", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await reorderDays(userId, Number(req.params.workoutId), req.body.dayIds);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Exercises ----------------------------- */

router.post("/days/:dayId/exercises", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = insertExerciseSchema.parse(req.body);
    const exercise = await createExercise(userId, Number(req.params.dayId), data);
    res.status(201).json(exercise);
  } catch (err) {
    next(err);
  }
});

router.patch("/exercises/:id", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const exercise = await updateExercise(userId, Number(req.params.id), req.body);
    res.json(exercise);
  } catch (err) {
    next(err);
  }
});

router.delete("/exercises/:id", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await deleteExercise(userId, Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/days/:dayId/exercises/reorder", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await reorderExercises(userId, Number(req.params.dayId), req.body.exerciseIds);
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
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const startedAt = req.body.startedAt ? new Date(req.body.startedAt) : undefined;
      const session = await logCompletedDay(
        userId,
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

router.get("/sessions", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(await getWorkoutSessions(userId));
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- Data ----------------------------- */

router.get("/logs", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = await exportData(userId);
    res.json(data.logs);
  } catch (err) {
    next(err);
  }
});

router.get("/logs/exercise/:name", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const logs = await getLogsByExerciseName(userId, decodeURIComponent(req.params.name));
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.get("/data/export", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(await exportData(userId));
  } catch (err) {
    next(err);
  }
});

router.post("/data/import", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { replaceExisting, ...data } = req.body;
    await importData(userId, data, Boolean(replaceExisting));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/data/reset", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await resetData(userId);
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

router.get("/schedule", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(await listScheduledWorkouts(userId));
  } catch (err) {
    next(err);
  }
});

router.get("/schedule/today", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(await getTodaySchedule(userId));
  } catch (err) {
    next(err);
  }
});

router.post("/schedule", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const scheduled = await createScheduledWorkout(userId, {
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
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await deleteScheduledWorkout(userId, Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;


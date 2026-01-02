import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.workouts.list.path, async (req, res) => {
    const workouts = await storage.getWorkouts();
    res.json(workouts);
  });

  app.get(api.workouts.get.path, async (req, res) => {
    const workout = await storage.getWorkout(Number(req.params.id));
    if (!workout) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.json(workout);
  });

  app.post(api.workouts.create.path, async (req, res) => {
    try {
      const input = api.workouts.create.input.parse(req.body);
      const workout = await storage.createWorkout(input);
      res.status(201).json(workout);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.workouts.delete.path, async (req, res) => {
    await storage.deleteWorkout(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.days.create.path, async (req, res) => {
    try {
      const input = api.days.create.input.parse(req.body);
      // Ensure we add the workoutId from the path
      const day = await storage.createDay({
        ...input,
        workoutId: Number(req.params.workoutId)
      });
      res.status(201).json(day);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.days.delete.path, async (req, res) => {
    await storage.deleteDay(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/days/:id/duplicate", async (req, res) => {
    try {
      const day = await storage.duplicateDay(Number(req.params.id));
      res.status(201).json(day);
    } catch (err) {
      res.status(404).json({ message: "Day not found" });
    }
  });

  app.post(api.exercises.create.path, async (req, res) => {
    try {
      const input = api.exercises.create.input.parse(req.body);
      const exercise = await storage.createExercise({
        ...input,
        dayId: Number(req.params.dayId)
      });
      res.status(201).json(exercise);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.exercises.update.path, async (req, res) => {
    try {
      const input = api.exercises.update.input.parse(req.body);
      const exercise = await storage.updateExercise(Number(req.params.id), input);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.json(exercise);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post("/api/days/:dayId/exercises/reorder", async (req, res) => {
    try {
      const { exerciseIds } = z.object({ exerciseIds: z.array(z.number()) }).parse(req.body);
      await storage.reorderExercises(Number(req.params.dayId), exerciseIds);
      res.status(200).json({ message: "Exercises reordered" });
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.exercises.delete.path, async (req, res) => {
    await storage.deleteExercise(Number(req.params.id));
    res.status(204).send();
  });

  // Seed Data
  const existingWorkouts = await storage.getWorkouts();
  if (existingWorkouts.length === 0) {
    const workout = await storage.createWorkout({
      name: "Full Body Beginner",
      description: "A simple 3-day full body routine for beginners.",
    });
    
    const dayA = await storage.createDay({
      workoutId: workout.id,
      name: "Day A",
    });

    await storage.createExercise({
      dayId: dayA.id,
      name: "Barbell Squat",
      sets: 3,
      reps: 5,
      weight: 135,
      notes: "Focus on depth",
    });

    await storage.createExercise({
      dayId: dayA.id,
      name: "Bench Press",
      sets: 3,
      reps: 5,
      weight: 95,
      notes: "Keep elbows tucked",
    });

    await storage.createExercise({
      dayId: dayA.id,
      name: "Bent Over Row",
      sets: 3,
      reps: 5,
      weight: 95,
      notes: "Keep back straight",
    });

    const dayB = await storage.createDay({
      workoutId: workout.id,
      name: "Day B",
    });
    
     await storage.createExercise({
      dayId: dayB.id,
      name: "Deadlift",
      sets: 1,
      reps: 5,
      weight: 185,
    });

    await storage.createExercise({
      dayId: dayB.id,
      name: "Overhead Press",
      sets: 3,
      reps: 5,
      weight: 65,
    });
  }

  return httpServer;
}

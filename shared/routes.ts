// shared/routes.ts
import { z } from "zod";
import {
  workoutSchema,
  workoutWithDaysSchema,
  workoutDaySchema,
  exerciseSchema,
  workoutLogSchema,
  exerciseLibrarySchema,
  workoutSessionSchema,
  scheduledWorkoutSchema,
} from "./schema";

/* ----------------------------- Helpers ----------------------------- */

export function buildUrl(
  path: string,
  params: Record<string, string | number>
) {
  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`:${key}`, String(value)),
    path
  );
}

/* ----------------------------- API ----------------------------- */

export const api = {
  workouts: {
    list: {
      path: "/api/workouts",
      responses: {
        200: z.array(workoutSchema),
      },
    },
    get: {
      path: "/api/workouts/:id",
      responses: {
        200: workoutWithDaysSchema,
      },
    },
    create: {
      path: "/api/workouts",
      responses: {
        201: workoutSchema,
      },
    },
    delete: {
      path: "/api/workouts/:id",
      responses: {
        204: z.void(),
      },
    },
  },

  days: {
    create: {
      path: "/api/workouts/:workoutId/days",
      responses: {
        201: workoutDaySchema,
      },
    },
    delete: {
      path: "/api/days/:id",
      responses: {
        204: z.void(),
      },
    },
    duplicate: {
      path: "/api/days/:id/duplicate",
      responses: {
        201: workoutDaySchema,
      },
    },
    reorder: {
      path: "/api/workouts/:workoutId/days/reorder",
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },

  exercises: {
    create: {
      path: "/api/days/:dayId/exercises",
      responses: {
        201: exerciseSchema,
      },
    },
    update: {
      path: "/api/exercises/:id",
      responses: {
        200: exerciseSchema,
      },
    },
    delete: {
      path: "/api/exercises/:id",
      responses: {
        204: z.void(),
      },
    },
    reorder: {
      path: "/api/days/:dayId/exercises/reorder",
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },

  logs: {
    list: {
      path: "/api/logs",
      responses: {
        200: z.array(workoutLogSchema),
      },
    },
    byExercise: {
      path: "/api/logs/exercise/:name",
      responses: {
        200: z.array(workoutLogSchema),
      },
    },
  },

  sessions: {
    list: {
      path: "/api/sessions",
      responses: {
        200: z.array(workoutSessionSchema),
      },
    },
  },

  exerciseLibrary: {
    list: {
      path: "/api/exercise-library",
      responses: {
        200: z.array(exerciseLibrarySchema),
      },
    },
    search: {
      path: "/api/exercise-library/search",
      responses: {
        200: z.array(exerciseLibrarySchema),
      },
    },
    create: {
      path: "/api/exercise-library",
      responses: {
        201: exerciseLibrarySchema,
      },
    },
  },

  schedule: {
    list: {
      path: "/api/schedule",
      responses: {
        200: z.array(scheduledWorkoutSchema),
      },
    },
    today: {
      path: "/api/schedule/today",
      responses: {
        200: z.array(scheduledWorkoutSchema),
      },
    },
    create: {
      path: "/api/schedule",
      responses: {
        201: scheduledWorkoutSchema,
      },
    },
    delete: {
      path: "/api/schedule/:id",
      responses: {
        204: z.void(),
      },
    },
  },
};


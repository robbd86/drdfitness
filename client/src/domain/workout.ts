import type { Exercise, SetData, WorkoutDay, Workout } from "./types";

export function initializeSetData(exercise: Exercise): SetData[] {
  return Array.from({ length: exercise.sets }, () => ({
    weight: exercise.weight || 0,
    reps: exercise.reps,
    completed: false,
  }));
}

export function areAllSetsComplete(setData: SetData[]): boolean {
  return setData.length > 0 && setData.every((s) => s.completed);
}

export function toggleSetCompletion(
  setData: SetData[],
  setIndex: number
): { updatedSetData: SetData[]; allComplete: boolean } {
  const updatedSetData = setData.map((set, idx) =>
    idx === setIndex ? { ...set, completed: !set.completed } : set
  );
  return {
    updatedSetData,
    allComplete: areAllSetsComplete(updatedSetData),
  };
}

export function adjustSetWeight(
  setData: SetData[],
  setIndex: number,
  delta: number
): SetData[] {
  return setData.map((set, idx) =>
    idx === setIndex
      ? { ...set, weight: Math.max(0, (set.weight || 0) + delta) }
      : set
  );
}

export function calculateDayProgress(day: WorkoutDay): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = day.exercises.length;
  const completed = day.exercises.filter((e) => e.completed).length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function calculateWorkoutProgress(workout: Workout): {
  completed: number;
  total: number;
  percentage: number;
} {
  let total = 0;
  let completed = 0;

  for (const day of workout.days) {
    for (const exercise of day.exercises) {
      total++;
      if (exercise.completed) completed++;
    }
  }

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function reorderArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

export interface SetData {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: number;
  dayId: number;
  name: string;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string | null;
  order: number;
  completed: boolean | null;
  setData: SetData[] | null;
  useCustomSets: boolean | null;
}

export interface WorkoutDay {
  id: number;
  workoutId: number;
  name: string;
  order: number;
  exercises: Exercise[];
}

export interface Workout {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date | null;
  days: WorkoutDay[];
}

export interface ExportData {
  workouts: Workout[];
  exportedAt: string;
}

export interface ImportOptions {
  replaceExisting: boolean;
}

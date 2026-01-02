import type { Workout, ExportData, SetData } from "./types";

export function formatWorkoutsAsJSON(workouts: Workout[]): string {
  const data: ExportData = {
    workouts,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function formatWorkoutsAsCSV(workouts: Workout[]): string {
  const rows: string[] = [
    "Workout,Day,Exercise,Set Number,Reps,Weight (KG),Completed,Notes",
  ];

  for (const workout of workouts) {
    for (const day of workout.days || []) {
      for (const exercise of day.exercises || []) {
        if (exercise.setData && exercise.setData.length > 0) {
          exercise.setData.forEach((set: SetData, i: number) => {
            rows.push(formatCSVRow(workout.name, day.name, exercise.name, i + 1, set.reps || exercise.reps, set.weight || 0, set.completed, exercise.notes));
          });
        } else {
          for (let i = 0; i < exercise.sets; i++) {
            rows.push(formatCSVRow(workout.name, day.name, exercise.name, i + 1, exercise.reps, exercise.weight || 0, false, exercise.notes));
          }
        }
      }
    }
  }

  return rows.join("\n");
}

function formatCSVRow(
  workoutName: string,
  dayName: string,
  exerciseName: string,
  setNumber: number,
  reps: number,
  weight: number,
  completed: boolean,
  notes: string | null
): string {
  const escape = (str: string) => `"${str.replace(/"/g, '""')}"`;
  return [
    escape(workoutName),
    escape(dayName),
    escape(exerciseName),
    setNumber,
    reps,
    weight,
    completed ? "Yes" : "No",
    escape(notes || ""),
  ].join(",");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportFile(text: string): { workouts: Workout[] } | null {
  try {
    const data = JSON.parse(text);
    if (!data.workouts || !Array.isArray(data.workouts)) {
      return null;
    }
    return { workouts: data.workouts };
  } catch {
    return null;
  }
}

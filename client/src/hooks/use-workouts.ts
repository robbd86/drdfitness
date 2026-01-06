// client/src/hooks/use-workouts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertWorkout, type InsertDay, type Exercise, type InsertExercise } from "@shared/schema";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiFetch";

// --- Workouts ---

export function useWorkouts() {
  return useQuery({
    queryKey: [api.workouts.list.path],
    queryFn: async () => {
      return apiGet(api.workouts.list.path, api.workouts.list.responses[200]);
    },
  });
}

export function useWorkout(id?: number) {
  return useQuery({
    queryKey: [api.workouts.get.path, id],
    enabled: typeof id === "number",
    queryFn: async () => {
      const url = buildUrl(api.workouts.get.path, { id: id as number });
      return apiGet(url, api.workouts.get.responses[200]);
    },
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkout) => {
      return apiPost(api.workouts.create.path, data, api.workouts.create.responses[201]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workouts.delete.path, { id });
      return apiDelete(url, api.workouts.delete.responses[204]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

// --- Days ---

export function useCreateDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, ...data }: InsertDay & { workoutId: number }) => {
      const url = buildUrl(api.days.create.path, { workoutId });
      return apiPost(url, data, api.days.create.responses[201]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useDuplicateDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workoutId }: { id: number; workoutId: number }) => {
      const url = buildUrl(api.days.duplicate.path, { id });
      return apiPost(url, undefined, api.days.duplicate.responses[201]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useDeleteDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workoutId }: { id: number; workoutId: number }) => {
      const url = buildUrl(api.days.delete.path, { id });
      return apiDelete(url, api.days.delete.responses[204]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useReorderDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workoutId,
      dayIds,
    }: {
      workoutId: number;
      dayIds: number[];
    }) => {
      const url = buildUrl(api.days.reorder.path, { workoutId });
      return apiPost(url, { dayIds }, api.days.reorder.responses[200]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

// --- Exercises ---

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dayId,
      workoutId,
      ...data
    }: InsertExercise & { dayId: number; workoutId: number }) => {
      const url = buildUrl(api.exercises.create.path, { dayId });
      return apiPost(url, data, api.exercises.create.responses[201]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      workoutId,
      ...updates
    }: { id: number; workoutId: number } & Partial<Omit<Exercise, "id" | "dayId">>) => {
      const url = buildUrl(api.exercises.update.path, { id });
      return apiPatch(url, updates, api.exercises.update.responses[200]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workoutId }: { id: number; workoutId: number }) => {
      const url = buildUrl(api.exercises.delete.path, { id });
      return apiDelete(url, api.exercises.delete.responses[204]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useReorderExercises() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dayId,
      workoutId,
      exerciseIds,
    }: {
      dayId: number;
      workoutId: number;
      exerciseIds: number[];
    }) => {
      const url = buildUrl(api.exercises.reorder.path, { dayId });
      return apiPost(url, { exerciseIds }, api.exercises.reorder.responses[200]);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.workouts.get.path, variables.workoutId],
      });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

// --- Logs / Progress ---

export function useWorkoutLogs() {
  return useQuery({
    queryKey: [api.logs.list.path],
    queryFn: async () => {
      return apiGet(api.logs.list.path, api.logs.list.responses[200]);
    },
  });
}

export function useExerciseLogs(exerciseName?: string) {
  return useQuery({
    queryKey: [api.logs.byExercise.path, exerciseName],
    enabled: !!exerciseName,
    queryFn: async () => {
      const url = buildUrl(api.logs.byExercise.path, { name: encodeURIComponent(exerciseName as string) });
      return apiGet(url, api.logs.byExercise.responses[200]);
    },
  });
}

export function useCompleteDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, dayId, startedAt }: { workoutId: number; dayId: number; startedAt?: Date }) => {
      return apiPost(`/api/workouts/${workoutId}/days/${dayId}/complete`, { startedAt: startedAt?.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.sessions.list.path] });
    },
  });
}

// --- Workout Sessions ---

export function useWorkoutSessions() {
  return useQuery({
    queryKey: [api.sessions.list.path],
    queryFn: async () => {
      return apiGet(api.sessions.list.path, api.sessions.list.responses[200]);
    },
  });
}

// --- Exercise Library ---

export function useExerciseLibrary() {
  return useQuery({
    queryKey: [api.exerciseLibrary.list.path],
    queryFn: async () => {
      return apiGet(api.exerciseLibrary.list.path, api.exerciseLibrary.list.responses[200]);
    },
  });
}

export function useSearchExerciseLibrary(query: string) {
  return useQuery({
    queryKey: [api.exerciseLibrary.search.path, query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const url = `${api.exerciseLibrary.search.path}?q=${encodeURIComponent(query)}`;
      return apiGet(url, api.exerciseLibrary.search.responses[200]);
    },
  });
}

export function useCreateExerciseLibraryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; muscleGroup: string; equipment?: string }) => {
      return apiPost(api.exerciseLibrary.create.path, data, api.exerciseLibrary.create.responses[201]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exerciseLibrary.list.path] });
    },
  });
}

// --- Scheduled Workouts ---

export function useScheduledWorkouts() {
  return useQuery({
    queryKey: [api.schedule.list.path],
    queryFn: async () => {
      return apiGet(api.schedule.list.path, api.schedule.list.responses[200]);
    },
  });
}

export function useTodaySchedule() {
  return useQuery({
    queryKey: [api.schedule.today.path],
    queryFn: async () => {
      return apiGet(api.schedule.today.path, api.schedule.today.responses[200]);
    },
  });
}

export function useCreateScheduledWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { workoutId: number; dayId: number; scheduledDate: Date; notes?: string }) => {
      return apiPost(api.schedule.create.path, {
        ...data,
        scheduledDate: data.scheduledDate.toISOString(),
      }, api.schedule.create.responses[201]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.schedule.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.schedule.today.path] });
    },
  });
}

export function useDeleteScheduledWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.schedule.delete.path, { id });
      return apiDelete(url, api.schedule.delete.responses[204]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.schedule.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.schedule.today.path] });
    },
  });
}

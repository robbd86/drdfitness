// client/src/hooks/use-workouts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertWorkout, type InsertDay, type InsertExercise } from "@shared/schema";
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
    }: { id: number; workoutId: number } & Partial<InsertExercise>) => {
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
      const url = buildUrl(api.logs.byExercise.path, { name: exerciseName as string });
      return apiGet(url, api.logs.byExercise.responses[200]);
    },
  });
}

export function useCompleteDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, dayId }: { workoutId: number; dayId: number }) => {
      // This route isn't in shared/routes.ts, so keep it explicit.
      return apiPost(`/api/workouts/${workoutId}/days/${dayId}/complete`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
    },
  });
}

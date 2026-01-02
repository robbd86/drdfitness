import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertWorkout, type InsertDay, type InsertExercise } from "@shared/schema";

// --- Workouts ---

export function useWorkouts() {
  return useQuery({
    queryKey: [api.workouts.list.path],
    queryFn: async () => {
      const res = await fetch(api.workouts.list.path);
      if (!res.ok) throw new Error("Failed to fetch workouts");
      return api.workouts.list.responses[200].parse(await res.json());
    },
  });
}

export function useWorkout(id: number) {
  return useQuery({
    queryKey: [api.workouts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workouts.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch workout");
      return api.workouts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkout) => {
      const res = await fetch(api.workouts.create.path, {
        method: api.workouts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create workout");
      return api.workouts.create.responses[201].parse(await res.json());
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
      const res = await fetch(url, { method: api.workouts.delete.method });
      if (!res.ok) throw new Error("Failed to delete workout");
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
      const res = await fetch(url, {
        method: api.days.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create day");
      return api.days.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

export function useDeleteDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workoutId }: { id: number; workoutId: number }) => {
      const url = buildUrl(api.days.delete.path, { id });
      const res = await fetch(url, { method: api.days.delete.method });
      if (!res.ok) throw new Error("Failed to delete day");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
      queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
    },
  });
}

// --- Exercises ---

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dayId, workoutId, ...data }: InsertExercise & { dayId: number, workoutId: number }) => {
      const url = buildUrl(api.exercises.create.path, { dayId });
      const res = await fetch(url, {
        method: api.exercises.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create exercise");
      return api.exercises.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workoutId, ...updates }: { id: number, workoutId: number } & Partial<InsertExercise>) => {
      const url = buildUrl(api.exercises.update.path, { id });
      const res = await fetch(url, {
        method: api.exercises.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update exercise");
      return api.exercises.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, workoutId }: { id: number; workoutId: number }) => {
      const url = buildUrl(api.exercises.delete.path, { id });
      const res = await fetch(url, { method: api.exercises.delete.method });
      if (!res.ok) throw new Error("Failed to delete exercise");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workouts.get.path, variables.workoutId] });
    },
  });
}

export function useReorderExercises() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dayId, exerciseIds }: { dayId: number; exerciseIds: number[] }) => {
      const res = await fetch(`/api/days/${dayId}/exercises/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder exercises");
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: [api.workouts.list.path] });
       queryClient.invalidateQueries({ queryKey: [api.workouts.get.path] }); 
    },
  });
}

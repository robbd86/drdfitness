import { apiRequest } from "@/lib/queryClient";
import type { Workout, Exercise, WorkoutDay, SetData } from "@/domain/types";

// In production, VITE_API_URL points to Railway backend
// In development, Vite proxies /api to localhost:5001
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const workoutApi = {
  async list(): Promise<Workout[]> {
    const res = await fetch(`${API_BASE}/workouts`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch workouts");
    return res.json();
  },

  async get(id: number): Promise<Workout> {
    const res = await fetch(`${API_BASE}/workouts/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch workout");
    return res.json();
  },

  async create(data: { name: string; description?: string }): Promise<Workout> {
    const res = await apiRequest("POST", `${API_BASE}/workouts`, data);
    return res.json();
  },

  async delete(id: number): Promise<void> {
    await apiRequest("DELETE", `${API_BASE}/workouts/${id}`);
  },
};

export const dayApi = {
  async create(workoutId: number, name: string): Promise<WorkoutDay> {
    const res = await apiRequest("POST", `${API_BASE}/workouts/${workoutId}/days`, { name });
    return res.json();
  },

  async delete(id: number): Promise<void> {
    await apiRequest("DELETE", `${API_BASE}/days/${id}`);
  },

  async duplicate(id: number): Promise<WorkoutDay> {
    const res = await apiRequest("POST", `${API_BASE}/days/${id}/duplicate`, {});
    return res.json();
  },
};

export const exerciseApi = {
  async create(dayId: number, data: Partial<Exercise>): Promise<Exercise> {
    const res = await apiRequest("POST", `${API_BASE}/days/${dayId}/exercises`, data);
    return res.json();
  },

  async update(id: number, data: Partial<Exercise>): Promise<Exercise> {
    const res = await apiRequest("PATCH", `${API_BASE}/exercises/${id}`, data);
    return res.json();
  },

  async delete(id: number): Promise<void> {
    await apiRequest("DELETE", `${API_BASE}/exercises/${id}`);
  },

  async reorder(dayId: number, exerciseIds: number[]): Promise<void> {
    await apiRequest("POST", `${API_BASE}/days/${dayId}/exercises/reorder`, { exerciseIds });
  },
};

export const dataApi = {
  async export(): Promise<{ workouts: Workout[]; exportedAt: string }> {
    const res = await fetch(`${API_BASE}/data/export`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to export data");
    return res.json();
  },

  async import(workouts: Workout[], replaceExisting: boolean): Promise<void> {
    await apiRequest("POST", `${API_BASE}/data/import`, { workouts, replaceExisting });
  },

  async reset(): Promise<void> {
    await apiRequest("DELETE", `${API_BASE}/data/reset`);
  },
};

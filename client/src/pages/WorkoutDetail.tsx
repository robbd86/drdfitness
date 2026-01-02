import { useRoute } from "wouter";
import { useWorkout, useDeleteDay, useReorderExercises } from "@/hooks/use-workouts";
import { Layout } from "@/components/Layout";
import { AddDayDialog } from "@/components/AddDayDialog";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { ExerciseItem } from "@/components/ExerciseItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Trash2, CalendarDays } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useEffect } from "react";
import { type Exercise } from "@shared/schema";

export default function WorkoutDetail() {
  const [, params] = useRoute("/workout/:id");
  const id = parseInt(params?.id || "0");
  const { data: workout, isLoading, error } = useWorkout(id);
  const deleteDay = useDeleteDay();
  const reorderExercises = useReorderExercises();
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [orderedExercises, setOrderedExercises] = useState<Record<number, Exercise[]>>({});

  useEffect(() => {
    if (workout) {
      const newOrdered: Record<number, Exercise[]> = {};
      workout.days.forEach(day => {
        newOrdered[day.id] = [...day.exercises].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      setOrderedExercises(newOrdered);
    }
  }, [workout]);

  const handleDragEnd = (event: DragEndEvent, dayId: number) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedExercises((prev) => {
        const currentExercises = prev[dayId] || [];
        const oldIndex = currentExercises.findIndex((item) => item.id === active.id);
        const newIndex = currentExercises.findIndex((item) => item.id === over?.id);
        
        const newExercises = arrayMove(currentExercises, oldIndex, newIndex);
        
        // Persist order
        reorderExercises.mutate({ 
          dayId, 
          exerciseIds: newExercises.map(e => e.id) 
        });

        return {
          ...prev,
          [dayId]: newExercises
        };
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-20 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !workout) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Workout not found</h2>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleDeleteDay = (dayId: number) => {
    if (confirm("Delete this day and all its exercises?")) {
      deleteDay.mutate({ id: dayId, workoutId: id }, {
        onSuccess: () => toast({ title: "Day Deleted", description: "The training day has been removed." })
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header Section */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Workouts
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-foreground tracking-tight">
              {workout.name}
            </h1>
            {workout.description && (
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {workout.description}
              </p>
            )}
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-8">
          <AnimatePresence>
            {workout.days.map((day, index) => (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border border-border/60 bg-card/40 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 md:p-6 border-b border-border/40 bg-secondary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <h3 className="text-xl font-bold font-display">{day.name}</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleDeleteDay(day.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="p-4 md:p-6">
                    {day.exercises.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-border/50">
                        <p className="text-sm">No exercises added yet.</p>
                      </div>
                    ) : (
                      <DndContext 
                        sensors={sensors} 
                        collisionDetection={closestCenter} 
                        onDragEnd={(e) => handleDragEnd(e, day.id)}
                      >
                        <SortableContext 
                          items={(orderedExercises[day.id] || day.exercises).map(e => e.id)} 
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {(orderedExercises[day.id] || day.exercises).map((exercise) => (
                              <ExerciseItem 
                                key={exercise.id} 
                                exercise={exercise} 
                                workoutId={workout.id} 
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <AddExerciseDialog dayId={day.id} workoutId={workout.id} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="py-4">
            <AddDayDialog workoutId={workout.id} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

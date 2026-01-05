import { useRoute } from "wouter";
import { useWorkout, useDeleteDay, useReorderExercises, useDuplicateDay, useCompleteDay, useReorderDays } from "@/hooks/use-workouts";
import { Layout } from "@/components/Layout";
import { AddDayDialog } from "@/components/AddDayDialog";
import { AddExerciseDialog } from "@/components/AddExerciseDialog";
import { ExerciseItem } from "@/components/ExerciseItem";
import { RestTimer } from "@/components/RestTimer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Trash2, CalendarDays, Copy, CheckCircle2, GripVertical } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect, useRef } from "react";
import { type Exercise, type Day } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Sortable Tab Component for day reordering
interface SortableTabProps {
  day: Day;
  activeTab: string;
  onTabChange: (value: string) => void;
}

function SortableTab({ day, activeTab, onTabChange }: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isDone = day.exercises.length > 0 && day.exercises.every(e => e.completed);
  const isActive = activeTab === day.id.toString();

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          "cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-muted/50 transition-colors",
          isDragging && "cursor-grabbing"
        )}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </button>
      <TabsTrigger 
        value={day.id.toString()}
        onClick={() => onTabChange(day.id.toString())}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all shadow-sm",
          isActive && "bg-orange-500 text-white",
          isDone && "border-b-2 border-green-500"
        )}
      >
        {day.name}
        {isDone && <Badge className="ml-2 bg-green-500 hover:bg-green-600 h-2 w-2 rounded-full p-0" />}
      </TabsTrigger>
    </div>
  );
}

export default function WorkoutDetail() {
  const [, params] = useRoute("/workout/:id");
  const id = parseInt(params?.id || "0");
  const { data: workout, isLoading, error } = useWorkout(id);
  const deleteDay = useDeleteDay();
  const duplicateDay = useDuplicateDay();
  const reorderExercises = useReorderExercises();
  const reorderDays = useReorderDays();
  const completeDay = useCompleteDay();
  const { toast } = useToast();
  
  // Track workout start time per day
  const workoutStartTimes = useRef<Record<number, Date>>({});
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [orderedExercises, setOrderedExercises] = useState<Record<number, Exercise[]>>({});
  const [orderedDays, setOrderedDays] = useState<Day[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  // Track when user first interacts with a day (start time)
  const handleStartWorkout = (dayId: number) => {
    if (!workoutStartTimes.current[dayId]) {
      workoutStartTimes.current[dayId] = new Date();
    }
  };

  useEffect(() => {
    if (workout) {
      const newOrdered: Record<number, Exercise[]> = {};
      workout.days.forEach(day => {
        newOrdered[day.id] = [...day.exercises].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      setOrderedExercises(newOrdered);
      setOrderedDays([...workout.days].sort((a, b) => (a.order || 0) - (b.order || 0)));
      if (workout.days.length > 0 && !activeTab) {
        const sortedDays = [...workout.days].sort((a, b) => (a.order || 0) - (b.order || 0));
        setActiveTab(sortedDays[0].id.toString());
      }
    }
  }, [workout]);

  // Start tracking when tab changes
  useEffect(() => {
    if (activeTab) {
      handleStartWorkout(parseInt(activeTab));
    }
  }, [activeTab]);

  const handleDragEnd = (event: DragEndEvent, dayId: number) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedExercises((prev) => {
        const currentExercises = prev[dayId] || [];
        const oldIndex = currentExercises.findIndex((item) => item.id === active.id);
        const newIndex = currentExercises.findIndex((item) => item.id === over?.id);
        
        const newExercises = arrayMove(currentExercises, oldIndex, newIndex);
        
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

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedDays((prev) => {
        const oldIndex = prev.findIndex((day) => day.id === active.id);
        const newIndex = prev.findIndex((day) => day.id === over?.id);
        
        const newDays = arrayMove(prev, oldIndex, newIndex);
        
        reorderDays.mutate({ 
          workoutId: id, 
          dayIds: newDays.map(d => d.id) 
        });

        return newDays;
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
      deleteDay.mutate({ id: dayId, workoutId: id });
    }
  };

  const handleDuplicateDay = (dayId: number) => {
    duplicateDay.mutate({ id: dayId, workoutId: id }, {
      onSuccess: (newDay) => {
        toast({ title: "Day Duplicated", description: "Created a copy of the workout day." });
        setActiveTab(newDay.id.toString());
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-20 px-4">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-orange-500 hover:opacity-80 mb-4 transition-all">
            <ChevronLeft className="w-4 h-4 mr-1" />
            WORKOUTS
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase italic">
              {workout.name}
            </h1>
            {workout.description && (
              <p className="text-base text-muted-foreground max-w-2xl font-medium border-l-4 border-orange-500/20 pl-4 py-1">
                {workout.description}
              </p>
            )}
          </div>
        </div>

        {workout.days.length === 0 ? (
          <div className="text-center py-20 bg-card/20 rounded-3xl border-2 border-dashed border-border/40">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-xl font-bold mb-2">No workout days yet</h3>
            <p className="text-muted-foreground mb-6">Start by adding your first training day.</p>
            <AddDayDialog workoutId={workout.id} />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="relative group">
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDayDragEnd}
              >
                <SortableContext 
                  items={orderedDays.map(d => d.id)} 
                  strategy={horizontalListSortingStrategy}
                >
                  <TabsList className="h-auto p-1 bg-secondary/30 backdrop-blur-md rounded-2xl flex-wrap justify-start gap-1">
                    {orderedDays.map((day) => (
                      <SortableTab 
                        key={day.id} 
                        day={day} 
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                      />
                    ))}
                    <div className="px-2 py-1">
                      <AddDayDialog workoutId={workout.id} />
                    </div>
                  </TabsList>
                </SortableContext>
              </DndContext>
            </div>

            <AnimatePresence mode="wait">
              {orderedDays.map((day) => (
                <TabsContent key={day.id} value={day.id.toString()} className="mt-0 outline-none">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col gap-3 mb-4 px-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-black uppercase tracking-widest border-orange-500/20 text-orange-500 px-3">
                          {day.exercises.length} EXERCISES
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-bold text-xs uppercase tracking-tighter h-8"
                            onClick={() => handleDuplicateDay(day.id)}
                          >
                            <Copy className="w-3 h-3 mr-2" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="font-bold text-xs uppercase tracking-tighter text-destructive h-8"
                            onClick={() => handleDeleteDay(day.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <RestTimer />
                    </div>

                    <div className="space-y-4">
                      {day.exercises.length === 0 ? (
                        <div className="text-center py-12 bg-secondary/5 rounded-3xl border-2 border-dashed border-border/20">
                          <p className="text-muted-foreground font-medium mb-4">Empty training day</p>
                          <AddExerciseDialog dayId={day.id} workoutId={workout.id} />
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
                            <div className="space-y-4">
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
                      
                      {day.exercises.length > 0 && (
                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                          <AddExerciseDialog dayId={day.id} workoutId={workout.id} />
                          <Button
                            variant="default"
                            className="w-full sm:w-auto font-bold"
                            onClick={() => {
                              const startedAt = workoutStartTimes.current[day.id];
                              completeDay.mutate({ workoutId: workout.id, dayId: day.id, startedAt }, {
                                onSuccess: () => {
                                  toast({ 
                                    title: "Workout Logged!", 
                                    description: "Your progress has been saved. View it in the Progress tab." 
                                  });
                                  // Clear the start time for this day
                                  delete workoutStartTimes.current[day.id];
                                },
                                onError: () => {
                                  toast({ 
                                    title: "Error", 
                                    description: "Failed to log workout", 
                                    variant: "destructive" 
                                  });
                                }
                              });
                            }}
                            disabled={completeDay.isPending}
                            data-testid="button-log-workout"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {completeDay.isPending ? "Logging..." : "Log Workout"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </TabsContent>
              ))}
            </AnimatePresence>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}

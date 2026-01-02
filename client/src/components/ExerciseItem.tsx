import { type Exercise } from "@shared/schema";
import { useUpdateExercise, useDeleteExercise } from "@/hooks/use-workouts";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Plus, Minus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EditExerciseDialog } from "./EditExerciseDialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ExerciseItemProps {
  exercise: Exercise;
  workoutId: number;
}

export function ExerciseItem({ exercise, workoutId }: ExerciseItemProps) {
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();
  const { toast } = useToast();
  const [showSets, setShowSets] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  const handleToggle = (checked: boolean) => {
    updateExercise.mutate({
      id: exercise.id,
      workoutId,
      completed: checked
    });
  };

  const handleWeightAdjust = (setIndex: number, delta: number) => {
    const newData = [...(exercise.setData || [])];
    if (!newData[setIndex]) return;
    newData[setIndex].weight = Math.max(0, (newData[setIndex].weight || 0) + delta);
    updateExercise.mutate({ id: exercise.id, workoutId, setData: newData });
  };

  const toggleSetComplete = (setIndex: number) => {
    const newData = [...(exercise.setData || [])];
    if (!newData[setIndex]) return;
    newData[setIndex].completed = !newData[setIndex].completed;
    
    // Auto-complete main exercise if all sets are done
    const allDone = newData.length > 0 && newData.every(s => s.completed);
    updateExercise.mutate({ 
      id: exercise.id, 
      workoutId, 
      setData: newData,
      completed: allDone
    });
  };

  // Initialize sets if needed
  useEffect(() => {
    if (!exercise.setData || exercise.setData.length === 0) {
      const initialSets = Array.from({ length: exercise.sets }).map(() => ({
        weight: exercise.weight || 0,
        reps: exercise.reps,
        completed: false
      }));
      updateExercise.mutate({ id: exercise.id, workoutId, setData: initialSets });
    }
  }, [exercise.id, exercise.sets, exercise.weight, exercise.reps, exercise.setData, workoutId]);

  if (!exercise.setData || exercise.setData.length === 0) {
    return (
      <Card className="p-4 border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group relative border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-300",
        exercise.completed && "opacity-60 bg-secondary/10",
        isDragging && "shadow-xl ring-2 ring-primary border-primary/50"
      )}
    >
      <div className="p-3 md:p-4">
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-primary transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>

          <Checkbox 
            checked={exercise.completed || false} 
            onCheckedChange={handleToggle}
            className="mt-1 h-5 w-5 rounded-md border-2"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className={cn(
                "font-bold text-base md:text-lg tracking-tight truncate",
                exercise.completed && "line-through text-muted-foreground"
              )}>
                {exercise.name}
              </h4>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => setShowSets(!showSets)}
                >
                  <Settings2 className={cn("h-4 w-4 transition-transform", showSets && "rotate-90")} />
                </Button>
                <EditExerciseDialog exercise={exercise} workoutId={workoutId} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteExercise.mutate({ id: exercise.id, workoutId })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono px-2 py-0 h-6 text-xs">
                {exercise.sets} Sets
              </Badge>
              <Badge variant="outline" className="font-mono px-2 py-0 h-6 text-xs border-primary/20 text-primary">
                {exercise.reps} Reps
              </Badge>
              {exercise.weight && (
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 py-0 h-6 text-xs font-bold">
                  {exercise.weight} KG
                </Badge>
              )}
            </div>
          </div>
        </div>

        {showSets && (
          <div className="mt-4 space-y-2 border-t border-border/20 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {exercise.setData.map((set, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg transition-colors",
                  set.completed ? "bg-primary/5" : "bg-secondary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-muted-foreground w-6">#{idx + 1}</span>
                  <Checkbox 
                    checked={set.completed} 
                    onCheckedChange={() => toggleSetComplete(idx)}
                    className="h-4 w-4"
                  />
                  <span className={cn("text-sm font-medium", set.completed && "line-through text-muted-foreground")}>
                    {set.reps} Reps
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 rounded-full border-border/50"
                    onClick={() => handleWeightAdjust(idx, -2.5)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <span className="text-sm font-bold font-mono">{set.weight}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">KG</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 rounded-full border-border/50"
                    onClick={() => handleWeightAdjust(idx, 2.5)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

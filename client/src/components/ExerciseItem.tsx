import { type Exercise } from "@shared/schema";
import { useUpdateExercise, useDeleteExercise, useExerciseLogs } from "@/hooks/use-workouts";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Settings2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EditExerciseDialog } from "./EditExerciseDialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EditableInputProps {
  value: number;
  onSave: (value: string) => void;
  inputMode: "numeric" | "decimal";
  className?: string;
  testId: string;
}

function EditableInput({ value, onSave, inputMode, className, testId }: EditableInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(String(value));
    }
  }, [value]);

  const handleBlur = () => {
    if (localValue !== String(value)) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={inputMode}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      data-testid={testId}
    />
  );
}

interface ExerciseItemProps {
  exercise: Exercise;
  workoutId: number;
}

export function ExerciseItem({ exercise, workoutId }: ExerciseItemProps) {
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();
  const { toast } = useToast();
  const [showSets, setShowSets] = useState(false);
  
  // Fetch previous performance
  const { data: previousLogs } = useExerciseLogs(exercise.name);
  const lastLog = previousLogs?.[0];
  
  // Calculate if current weight is higher/lower than last session
  const currentMaxWeight = exercise.setData?.reduce((max, s) => Math.max(max, s.weight || 0), 0) || exercise.weight || 0;
  const lastWeight = lastLog?.weight || 0;
  const weightTrend = currentMaxWeight > lastWeight ? "up" : currentMaxWeight < lastWeight ? "down" : "same";

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

  const handleWeightChange = (setIndex: number, value: string) => {
    const newData = [...(exercise.setData || [])];
    if (!newData[setIndex]) return;
    const parsed = parseFloat(value);
    newData[setIndex].weight = isNaN(parsed) ? 0 : Math.max(0, parsed);
    updateExercise.mutate({ id: exercise.id, workoutId, setData: newData });
  };

  const handleRepsChange = (setIndex: number, value: string) => {
    const newData = [...(exercise.setData || [])];
    if (!newData[setIndex]) return;
    const parsed = parseInt(value, 10);
    newData[setIndex].reps = isNaN(parsed) ? 1 : Math.max(1, parsed);
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
        isDragging && "shadow-xl ring-2 ring-orange-500 border-orange-500/50"
      )}
    >
      <div className="p-3 md:p-4">
        <div className="flex items-start gap-3">
          <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-orange-500 transition-colors">
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
                  className="h-8 w-8 text-muted-foreground hover:text-orange-500"
                  onClick={() => setShowSets(!showSets)}
                  data-testid={`button-expand-sets-${exercise.id}`}
                >
                  <Settings2 className={cn("h-4 w-4 transition-transform", showSets && "rotate-90")} />
                </Button>
                <EditExerciseDialog exercise={exercise} workoutId={workoutId} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteExercise.mutate({ id: exercise.id, workoutId })}
                  data-testid={`button-delete-exercise-${exercise.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono px-2 py-0 h-6 text-xs">
                {exercise.sets} Sets
              </Badge>
              <Badge variant="outline" className="font-mono px-2 py-0 h-6 text-xs border-orange-500/20 text-orange-500">
                {exercise.reps} Reps
              </Badge>
              {exercise.weight && (
                <Badge variant="default" className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-none px-2 py-0 h-6 text-xs font-bold">
                  {exercise.weight} KG
                </Badge>
              )}
              {lastLog && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-mono px-2 py-0 h-6 text-xs cursor-help",
                          weightTrend === "up" && "border-green-500/30 text-green-500",
                          weightTrend === "down" && "border-red-500/30 text-red-500",
                          weightTrend === "same" && "border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {weightTrend === "up" && <TrendingUp className="w-3 h-3 mr-1" />}
                        {weightTrend === "down" && <TrendingDown className="w-3 h-3 mr-1" />}
                        {weightTrend === "same" && <Minus className="w-3 h-3 mr-1" />}
                        Last: {lastLog.weight}kg
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Last session: {lastLog.sets}×{lastLog.reps} @ {lastLog.weight}kg</p>
                      <p className="text-xs text-muted-foreground">{new Date(lastLog.completedAt).toLocaleDateString()}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                  "flex items-center justify-between p-2 rounded-lg transition-colors gap-2",
                  set.completed ? "bg-orange-500/5" : "bg-secondary/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-muted-foreground w-5">#{idx + 1}</span>
                  <Checkbox 
                    checked={set.completed} 
                    onCheckedChange={() => toggleSetComplete(idx)}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <EditableInput
                    value={set.reps}
                    onSave={(val) => handleRepsChange(idx, val)}
                    inputMode="numeric"
                    className={cn(
                      "w-12 h-7 text-center text-sm font-bold font-mono bg-background border border-border/50 rounded",
                      set.completed && "line-through text-muted-foreground"
                    )}
                    testId={`input-reps-${idx}`}
                  />
                  <span className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">Reps</span>
                </div>

                <div className="flex flex-col items-center">
                  <EditableInput
                    value={set.weight}
                    onSave={(val) => handleWeightChange(idx, val)}
                    inputMode="decimal"
                    className="w-16 h-7 text-center text-sm font-bold font-mono bg-background border border-border/50 rounded"
                    testId={`input-weight-${idx}`}
                  />
                  <span className="text-[9px] text-muted-foreground uppercase font-bold mt-0.5">KG</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

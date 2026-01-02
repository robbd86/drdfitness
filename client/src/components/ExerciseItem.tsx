import { type Exercise } from "@shared/schema";
import { useUpdateExercise, useDeleteExercise } from "@/hooks/use-workouts";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { EditExerciseDialog } from "./EditExerciseDialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ExerciseItemProps {
  exercise: Exercise;
  workoutId: number;
}

export function ExerciseItem({ exercise, workoutId }: ExerciseItemProps) {
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();
  const { toast } = useToast();

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
    zIndex: isDragging ? 1 : 0,
  };

  const handleToggle = (checked: boolean) => {
    updateExercise.mutate({
      id: exercise.id,
      workoutId,
      completed: checked
    }, {
      onError: () => {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    deleteExercise.mutate({ id: exercise.id, workoutId }, {
      onSuccess: () => toast({ title: "Deleted", description: "Exercise removed" })
    });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group flex items-start gap-3 p-4 rounded-xl border border-transparent hover:border-border/50 transition-all bg-secondary/20 hover:bg-secondary/40 relative touch-none",
        exercise.completed && "opacity-60",
        isDragging && "opacity-50 ring-2 ring-primary bg-secondary/60"
      )}
    >
      <div {...attributes} {...listeners} className="mt-1.5 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <Checkbox 
        checked={exercise.completed || false} 
        onCheckedChange={handleToggle}
        className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "font-medium text-foreground truncate pr-2",
            exercise.completed && "line-through text-muted-foreground"
          )}>
            {exercise.name}
          </h4>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <EditExerciseDialog exercise={exercise} workoutId={workoutId} />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors ml-1"
              onClick={handleDelete}
              disabled={deleteExercise.isPending}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground font-mono">
          <span>{exercise.sets} sets</span>
          <span>×</span>
          <span>{exercise.reps} reps</span>
          {exercise.weight && (
            <>
              <span>@</span>
              <span className="text-primary font-semibold">{exercise.weight} lbs</span>
            </>
          )}
        </div>
        
        {exercise.notes && (
          <p className="mt-2 text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
            {exercise.notes}
          </p>
        )}
      </div>
    </div>
  );
}

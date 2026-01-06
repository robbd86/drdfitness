import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateExercise, useWorkout, useSearchExerciseLibrary, useExerciseLogs } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";

interface AddExerciseDialogProps {
  dayId: number;
  workoutId: number;
}

const formSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  sets: z.coerce.number().min(1),
  reps: z.coerce.number().min(1),
  weight: z.coerce.number().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddExerciseDialog({ dayId, workoutId }: AddExerciseDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();
  const createExercise = useCreateExercise();
  const { data: workout } = useWorkout(workoutId);
  const { data: suggestions } = useSearchExerciseLibrary(searchQuery);
  
  // Get previous logs for selected exercise name
  const exerciseName = searchQuery;
  const { data: previousLogs } = useExerciseLogs(exerciseName);
  const lastLog = previousLogs?.[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sets: 3,
      reps: 10,
      notes: "",
      completed: false,
    },
  });

  // When user selects from suggestions, prefill with last performance
  const handleSelectSuggestion = (name: string) => {
    form.setValue("name", name);
    setSearchQuery(name);
    setShowSuggestions(false);
  };

  // Update weight based on last log when name changes
  useEffect(() => {
    if (lastLog && lastLog.weight) {
      form.setValue("weight", lastLog.weight);
    }
    if (lastLog && lastLog.reps) {
      form.setValue("reps", lastLog.reps);
    }
    if (lastLog && lastLog.sets) {
      form.setValue("sets", lastLog.sets);
    }
  }, [lastLog, form]);

  const onSubmit = (data: FormValues) => {
    const day = workout?.days?.find((d) => d.id === dayId);
    const order = day?.exercises?.length ?? 0;
    createExercise.mutate(
      { ...data, dayId, workoutId, order },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          toast({ title: "Exercise added" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" });
        },
      }
    );
  };
  const handleFormSubmit = form.handleSubmit(onSubmit);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full mt-2">
          <Plus className="mr-2 h-4 w-4" />
          Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription>Add a new exercise to this training day.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Exercise Name with Autocomplete */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Exercise Name</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="e.g. Bench Press"
                        {...field}
                        ref={(el) => {
                          field.ref(el);
                          inputRef.current = el;
                        }}
                        autoComplete="off"
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                    </FormControl>
                    {showSuggestions && suggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                        {suggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-secondary/50 flex items-center justify-between group"
                            onMouseDown={() => handleSelectSuggestion(item.name)}
                          >
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{item.muscleGroup}</span>
                            </div>
                            {item.equipment && (
                              <span className="text-xs text-muted-foreground">{item.equipment}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Previous Performance Hint */}
            {lastLog && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm">
                <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div>
                  <span className="text-muted-foreground">Last session: </span>
                  <span className="font-bold text-orange-500">
                    {lastLog.sets}×{lastLog.reps} @ {lastLog.weight}kg
                  </span>
                  <span className="text-muted-foreground text-xs ml-2">
                    ({new Date(lastLog.completedAt).toLocaleDateString()})
                  </span>
                </div>
              </div>
            )}

            {/* Sets, Reps, Weight in a row */}
            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="sets"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sets</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reps</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kg</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes - compact */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any notes..."
                      className="resize-none h-16"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Submit Button - Always visible in DialogFooter */}
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={createExercise.isPending}
              >
                {createExercise.isPending ? "Adding..." : "Add Exercise"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}



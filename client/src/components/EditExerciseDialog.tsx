import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Exercise } from "@shared/schema";
import { useUpdateExercise } from "@/hooks/use-workouts";
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
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface EditExerciseDialogProps {
  exercise: Exercise;
  workoutId: number;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sets: z.coerce.number().min(1, "Must have at least 1 set"),
  reps: z.coerce.number().min(1, "Must have at least 1 rep"),
  weight: z.coerce.number().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditExerciseDialog({ exercise, workoutId }: EditExerciseDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const updateExercise = useUpdateExercise();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exercise.name,
      sets: exercise.sets ?? 3,
      reps: exercise.reps ?? 10,
      weight: exercise.weight ?? undefined,
      notes: exercise.notes ?? "",
      completed: exercise.completed ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: exercise.name,
        sets: exercise.sets ?? 3,
        reps: exercise.reps ?? 10,
        weight: exercise.weight ?? undefined,
        notes: exercise.notes ?? "",
        completed: exercise.completed ?? false,
      });
    }
  }, [open, exercise, form]);

  const onSubmit = (data: FormValues) => {
    updateExercise.mutate(
      { ...data, id: exercise.id, workoutId },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Success", description: "Exercise updated" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update exercise", variant: "destructive" });
        },
      }
    );
  };
  const handleFormSubmit = form.handleSubmit(onSubmit);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange-500">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
          <DialogDescription>Update the exercise details.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bench Press" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={updateExercise.isPending}
              >
                {updateExercise.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

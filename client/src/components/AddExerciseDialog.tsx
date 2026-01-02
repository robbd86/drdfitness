import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExerciseSchema } from "@shared/schema";
import { useCreateExercise } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface AddExerciseDialogProps {
  dayId: number;
  workoutId: number;
}

const formSchema = insertExerciseSchema.omit({ dayId: true }).extend({
  sets: z.coerce.number().min(1, "Must have at least 1 set"),
  reps: z.coerce.number().min(1, "Must have at least 1 rep"),
  weight: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

interface ExerciseFormProps {
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  isMobile?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

function ExerciseForm({ onSubmit, isPending, isMobile = false, formRef }: ExerciseFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      sets: 3,
      reps: 10,
      notes: "",
      completed: false
    },
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  return (
    <Form {...form}>
      <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Bench Press" {...field} onFocus={handleFocus} data-testid="input-exercise-name" />
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
                  <Input type="number" {...field} onFocus={handleFocus} data-testid="input-sets" />
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
                  <Input type="number" {...field} onFocus={handleFocus} data-testid="input-reps" />
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
                  <Input type="number" {...field} value={field.value || ''} onFocus={handleFocus} data-testid="input-weight" />
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Drop set on last set..." {...field} value={field.value || ''} onFocus={handleFocus} data-testid="input-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isMobile && (
          <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-exercise">
            {isPending ? "Adding..." : "Add Exercise"}
          </Button>
        )}
      </form>
    </Form>
  );
}

export function AddExerciseDialog({ dayId, workoutId }: AddExerciseDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createExercise = useCreateExercise();
  const isMobile = useIsMobile();

  const onSubmit = (data: FormValues) => {
    createExercise.mutate({ ...data, dayId, workoutId }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Success", description: "Exercise added" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add exercise", variant: "destructive" });
      },
    });
  };

  const triggerButton = (
    <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-primary" data-testid="button-add-exercise">
      <Plus className="mr-2 h-4 w-4" />
      Add Exercise
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent className="flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>Add Exercise</DrawerTitle>
            <DrawerDescription className="sr-only">Fill in the exercise details below</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <ExerciseForm onSubmit={onSubmit} isPending={createExercise.isPending} isMobile={true} />
          </div>
          <DrawerFooter className="flex-shrink-0 border-t bg-background pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button 
              type="button" 
              className="w-full" 
              disabled={createExercise.isPending}
              onClick={() => {
                const form = document.querySelector('[data-testid="input-exercise-name"]')?.closest('form');
                if (form) {
                  form.requestSubmit();
                }
              }}
              data-testid="button-submit-exercise-mobile"
            >
              {createExercise.isPending ? "Adding..." : "Add Exercise"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription className="sr-only">Fill in the exercise details below</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <ExerciseForm onSubmit={onSubmit} isPending={createExercise.isPending} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExerciseSchema, type Exercise } from "@shared/schema";
import { useUpdateExercise } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface EditExerciseDialogProps {
  exercise: Exercise;
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
    const checkMobile = () => setIsMobile(window.innerWidth < 480);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}

export function EditExerciseDialog({ exercise, workoutId }: EditExerciseDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const updateExercise = useUpdateExercise();
  const isMobile = useIsMobile();
  
  useScrollLock(open && isMobile);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight ?? undefined,
      notes: exercise.notes,
      completed: exercise.completed
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight ?? undefined,
        notes: exercise.notes,
        completed: exercise.completed
      });
    }
  }, [open, exercise, form]);

  const onSubmit = (data: FormValues) => {
    updateExercise.mutate({ ...data, id: exercise.id, workoutId }, {
      onSuccess: () => {
        setOpen(false);
        toast({ title: "Success", description: "Exercise updated" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update exercise", variant: "destructive" });
      },
    });
  };

  const triggerButton = (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-muted-foreground hover:text-primary"
      data-testid="button-edit-exercise"
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-edit-exercise">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Bench Press" {...field} data-testid="input-exercise-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="sets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sets</FormLabel>
                <FormControl>
                  <Input type="number" {...field} data-testid="input-exercise-sets" />
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
                  <Input type="number" {...field} data-testid="input-exercise-reps" />
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
                  <Input 
                    type="number" 
                    step="any" 
                    inputMode="decimal"
                    {...field} 
                    value={field.value || ''} 
                    data-testid="input-exercise-weight"
                  />
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
                <Textarea 
                  placeholder="Drop set on last set..." 
                  {...field} 
                  value={field.value || ''} 
                  data-testid="input-exercise-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isMobile && (
          <Button type="submit" className="w-full" disabled={updateExercise.isPending}>
            {updateExercise.isPending ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </form>
    </Form>
  );

  if (isMobile) {
    return (
      <>
        <div onClick={() => setOpen(true)}>
          {triggerButton}
        </div>
        {open && createPortal(
          <div 
            className="fixed inset-0 z-[100] flex flex-col bg-background"
            style={{ 
              width: '100vw',
              height: '100dvh',
              borderRadius: 0,
              paddingTop: 'env(safe-area-inset-top)',
            }}
            data-testid="modal-edit-exercise"
          >
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-xl font-display font-bold">Edit Exercise</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
                data-testid="button-close-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {formContent}
            </div>
            
            <div 
              className="flex-shrink-0 border-t bg-background p-4"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <Button 
                type="button" 
                className="w-full font-bold" 
                disabled={updateExercise.isPending}
                onClick={() => form.handleSubmit(onSubmit)()}
                data-testid="button-submit-exercise-mobile"
              >
                {updateExercise.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
          <DialogDescription className="sr-only">Edit the exercise details</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}

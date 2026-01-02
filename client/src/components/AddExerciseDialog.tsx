import { useState, useEffect, useRef } from "react";
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
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

/* ───────────────────────────────────────────── */
/* Types & Schema                                */
/* ───────────────────────────────────────────── */

interface AddExerciseDialogProps {
  dayId: number;
  workoutId: number;
}

const formSchema = insertExerciseSchema.omit({ dayId: true }).extend({
  sets: z.coerce.number().min(1),
  reps: z.coerce.number().min(1),
  weight: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

/* ───────────────────────────────────────────── */
/* Hooks                                        */
/* ───────────────────────────────────────────── */

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

/**
 * CRITICAL FIX:
 * Tracks the REAL visible viewport height when the keyboard opens.
 */
function useVisualViewportHeight() {
  const [height, setHeight] = useState(() => {
    if (typeof window === "undefined") return 0;
    return window.visualViewport?.height ?? window.innerHeight;
  });

  useEffect(() => {
    if (!window.visualViewport) return;

    const update = () => setHeight(window.visualViewport!.height);

    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);

  return height;
}

/* ───────────────────────────────────────────── */
/* Exercise Form                                */
/* ───────────────────────────────────────────── */

function ExerciseForm({
  onSubmit,
  isPending,
  isMobile,
  formRef,
}: {
  onSubmit: (data: FormValues) => void;
  isPending: boolean;
  isMobile?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}) {
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

  const handleFocus = (e: React.FocusEvent<any>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exercise Name</FormLabel>
              <FormControl>
                <Input {...field} onFocus={handleFocus} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-3">
          {["sets", "reps", "weight"].map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {fieldName === "weight" ? "Kg" : fieldName}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={fieldName === "weight" ? "0.5" : "1"}
                      {...field}
                      onFocus={handleFocus}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} onFocus={handleFocus} />
              </FormControl>
            </FormItem>
          )}
        />

        {!isMobile && (
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding..." : "Add Exercise"}
          </Button>
        )}
      </form>
    </Form>
  );
}

/* ───────────────────────────────────────────── */
/* Main Component                               */
/* ───────────────────────────────────────────── */

export function AddExerciseDialog({
  dayId,
  workoutId,
}: AddExerciseDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createExercise = useCreateExercise();
  const isMobile = useIsMobile();
  const viewportHeight = useVisualViewportHeight();
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (data: FormValues) => {
    createExercise.mutate(
      { ...data, dayId, workoutId },
      {
        onSuccess: () => {
          setOpen(false);
          toast({ title: "Exercise added" });
        },
      }
    );
  };

  const triggerButton = (
    <Button variant="ghost" size="sm" className="w-full mt-2" data-testid="button-add-exercise">
      <Plus className="mr-2 h-4 w-4" />
      Add Exercise
    </Button>
  );

  /* ───────────── MOBILE FULLSCREEN MODAL ───────────── */

  if (isMobile) {
    return (
      <>
        <div onClick={() => setOpen(true)}>{triggerButton}</div>

        {open && (
          <div
            className="fixed inset-0 z-50 flex flex-col bg-background"
            style={{ height: viewportHeight }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Add Exercise</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
                data-testid="button-close-modal"
              >
                <X />
              </Button>
            </div>

            {/* Scrollable body (keyboard-safe) */}
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[14rem]">
              <ExerciseForm
                onSubmit={onSubmit}
                isPending={createExercise.isPending}
                isMobile
                formRef={formRef}
              />
            </div>

            {/* Fixed footer */}
            <div className="border-t p-4 bg-background">
              <Button
                className="w-full"
                disabled={createExercise.isPending}
                onClick={() => formRef.current?.requestSubmit()}
              >
                {createExercise.isPending ? "Adding..." : "Add Exercise"}
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ───────────── DESKTOP DIALOG ───────────── */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogDescription className="sr-only">
            Add a new exercise
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <ExerciseForm
            onSubmit={onSubmit}
            isPending={createExercise.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}



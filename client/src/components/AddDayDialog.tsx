import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateDay, useWorkout } from "@/hooks/use-workouts";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface AddDayDialogProps {
  workoutId: number;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  order: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddDayDialog({ workoutId }: AddDayDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createDay = useCreateDay();
  const { data: workout } = useWorkout(workoutId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      order: 0,
    },
  });

  const onSubmit = (data: FormValues) => {
    const order = workout?.days?.length ?? 0;
    createDay.mutate(
      { ...data, workoutId, order },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          toast({ title: "Success", description: "Day added successfully" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add day", variant: "destructive" });
        },
      }
    );
  };
  const handleFormSubmit = form.handleSubmit(onSubmit);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-dashed border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Day
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Add Training Day</DialogTitle>
          <DialogDescription>Create a new training day for this workout.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Push Day, Leg Day" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={createDay.isPending}
              >
                {createDay.isPending ? "Adding..." : "Add Day"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

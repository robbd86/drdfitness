import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDaySchema, type InsertDay } from "@shared/schema";
import { useCreateDay } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddDayDialogProps {
  workoutId: number;
}

export function AddDayDialog({ workoutId }: AddDayDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createDay = useCreateDay();

  const form = useForm<Omit<InsertDay, "workoutId">>({
    resolver: zodResolver(insertDaySchema.omit({ workoutId: true })),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: Omit<InsertDay, "workoutId">) => {
    createDay.mutate({ ...data, workoutId }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "Success", description: "Day added successfully" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add day", variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Training Day
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Training Day</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Leg Day, Push A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={createDay.isPending}>
              {createDay.isPending ? "Adding..." : "Add Day"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

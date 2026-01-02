import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutSchema, type InsertWorkout } from "@shared/schema";
import { useCreateWorkout } from "@/hooks/use-workouts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreateWorkoutDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createWorkout = useCreateWorkout();

  const form = useForm<InsertWorkout>({
    resolver: zodResolver(insertWorkoutSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: InsertWorkout) => {
    createWorkout.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "Success", description: "Workout created successfully" });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create workout", variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-semibold">
          <Plus className="mr-2 h-5 w-5" />
          New Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Create New Workout</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Upper Body Power" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Focus on compound movements..." 
                      className="resize-none bg-background/50" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full font-bold" 
              disabled={createWorkout.isPending}
            >
              {createWorkout.isPending ? "Creating..." : "Create Workout"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

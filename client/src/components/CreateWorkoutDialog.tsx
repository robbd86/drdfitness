import { useState, useEffect } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export function CreateWorkoutDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createWorkout = useCreateWorkout();
  const isMobile = useIsMobile();
  
  useScrollLock(open && isMobile);

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

  const triggerButton = (
    <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-semibold" data-testid="button-create-workout">
      <Plus className="mr-2 h-5 w-5" />
      New Workout
    </Button>
  );

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-create-workout">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Upper Body Power" {...field} className="bg-background/50" data-testid="input-workout-name" />
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
                  data-testid="input-workout-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isMobile && (
          <Button 
            type="submit" 
            className="w-full font-bold" 
            disabled={createWorkout.isPending}
            data-testid="button-submit-workout"
          >
            {createWorkout.isPending ? "Creating..." : "Create Workout"}
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
        {open && (
          <div 
            className="fixed z-50 flex flex-col bg-background"
            style={{ 
              top: 0,
              left: 0,
              width: '100vw',
              height: '100dvh',
              borderRadius: 0,
              paddingTop: 'env(safe-area-inset-top)',
            }}
          >
            {/* Header - fixed at top */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-xl font-display font-bold">Create New Workout</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
                data-testid="button-close-modal"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              {formContent}
            </div>
            
            {/* Fixed Footer */}
            <div 
              className="flex-shrink-0 border-t bg-background p-4"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
              <Button 
                type="button" 
                className="w-full font-bold" 
                disabled={createWorkout.isPending}
                onClick={() => form.handleSubmit(onSubmit)()}
                data-testid="button-submit-workout-mobile"
              >
                {createWorkout.isPending ? "Creating..." : "Create Workout"}
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Create New Workout</DialogTitle>
          <DialogDescription className="sr-only">Fill in the workout details below</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}

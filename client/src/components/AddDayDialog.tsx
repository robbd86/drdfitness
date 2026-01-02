import { useState, useEffect } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddDayDialogProps {
  workoutId: number;
}

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

export function AddDayDialog({ workoutId }: AddDayDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createDay = useCreateDay();
  const isMobile = useIsMobile();
  
  useScrollLock(open && isMobile);

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

  const triggerButton = (
    <Button 
      variant="outline" 
      className="w-full border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-primary"
      data-testid="button-add-day"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Training Day
    </Button>
  );

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-add-day">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g. Leg Day, Push A" 
                  {...field} 
                  className="bg-background/50"
                  data-testid="input-day-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isMobile && (
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createDay.isPending}
            data-testid="button-submit-day"
          >
            {createDay.isPending ? "Adding..." : "Add Day"}
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
            className="fixed inset-0 z-[100] flex flex-col bg-background"
            style={{ 
              width: '100vw',
              height: '100dvh',
              borderRadius: 0,
              paddingTop: 'env(safe-area-inset-top)',
            }}
            data-testid="modal-add-day"
          >
            {/* Header - fixed at top */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-xl font-display font-bold">Add Training Day</h2>
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
                disabled={createDay.isPending}
                onClick={() => form.handleSubmit(onSubmit)()}
                data-testid="button-submit-day-mobile"
              >
                {createDay.isPending ? "Adding..." : "Add Day"}
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Training Day</DialogTitle>
          <DialogDescription className="sr-only">Enter the name for the new training day</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}

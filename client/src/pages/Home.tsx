import { useWorkouts, useDeleteWorkout } from "@/hooks/use-workouts";
import { CreateWorkoutDialog } from "@/components/CreateWorkoutDialog";
import { DataManagement } from "@/components/DataManagement";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight, Calendar, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { data: workouts, isLoading } = useWorkouts();
  const deleteWorkout = useDeleteWorkout();
  const { toast } = useToast();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this workout?")) {
      deleteWorkout.mutate(id, {
        onSuccess: () => toast({ title: "Deleted", description: "Workout removed" })
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Your Workouts
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your training splits and track progress.
            </p>
          </div>
          <CreateWorkoutDialog />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl w-full bg-secondary/50" />
            ))}
          </div>
        ) : workouts?.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-border/50 bg-secondary/10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Dumbbell className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No workouts yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Get started by creating your first workout plan. It only takes a few seconds.
            </p>
            <CreateWorkoutDialog />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {workouts?.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/workout/${workout.id}`}>
                  <Card className="h-full group hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm cursor-pointer overflow-hidden border-border/50 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-6 relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(e, workout.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {workout.name}
                      </h3>
                      
                      {workout.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm mb-4 flex-1">
                          {workout.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/30">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {workout.createdAt && format(new Date(workout.createdAt), 'MMM d, yyyy')}
                        </div>
                        <span className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                          View Plan <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="pt-8 border-t border-border/30">
          <DataManagement />
        </div>
      </div>
    </Layout>
  );
}

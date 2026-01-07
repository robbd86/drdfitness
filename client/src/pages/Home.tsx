import { useWorkouts, useDeleteWorkout, useTodaySchedule, useWorkoutSessions } from "@/hooks/use-workouts";
import { CreateWorkoutDialog } from "@/components/CreateWorkoutDialog";
import { DataManagement } from "@/components/DataManagement";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight, Calendar, Dumbbell, Zap, ArrowRight, CheckCircle2, TrendingUp, Target, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { data: workouts, isLoading } = useWorkouts();
  const { data: todaySchedule } = useTodaySchedule();
  const { data: sessions } = useWorkoutSessions();
  const deleteWorkout = useDeleteWorkout();
  const { toast } = useToast();

  const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Show confirmation toast with undo option
    const workout = workouts?.find(w => w.id === id);
    
    deleteWorkout.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Workout Deleted",
          description: `"${name}" has been removed.`,
          duration: 5000,
        });
      }
    });
  };

  // Calculate progress stats
  const totalSessions = sessions?.length || 0;
  const lastWorkoutDate = sessions?.[0]?.completedAt 
    ? new Date(sessions[0].completedAt) 
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
              Your Workouts
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your training splits and track progress.
            </p>
          </div>
          <CreateWorkoutDialog />
        </div>

        {/* Progress Summary Card */}
        {!isLoading && totalSessions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-orange-500/20">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold">Your Progress</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalSessions}</p>
                    <p className="text-xs text-muted-foreground">Workouts Completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workouts?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Workouts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {lastWorkoutDate ? format(lastWorkoutDate, 'MMM d, yyyy') : 'No sessions'}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Workout</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Today's Scheduled Workout */}
        {todaySchedule && todaySchedule.length > 0 && !todaySchedule[0].completed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 md:p-6 bg-gradient-to-r from-orange-950/50 to-amber-950/30 border-orange-500/40 hover:border-orange-500/60 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="outline" className="mb-1 text-orange-400 border-orange-500/30 text-xs">
                    TODAY'S WORKOUT
                  </Badge>
                  <p className="text-lg font-bold truncate">Scheduled training session</p>
                </div>
                <Link href={`/workout/${todaySchedule[0].workoutId}`}>
                  <Button className="gradient-primary font-bold gap-2">
                    Start <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Onboarding Checklist - Show only for new users */}
        {!isLoading && workouts && workouts.length < 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-orange-500/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  🎯
                </span>
                Getting Started
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-orange-500/50" />
                  <span>Add your first exercise</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-orange-500/50" />
                  <span>Log your first set</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-orange-500/50" />
                  <span>Track your progress</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl w-full bg-slate-800" />
            ))}
          </div>
        ) : workouts?.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-orange-500/30 bg-orange-500/5">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white">
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
                  <Card className="h-full group hover:shadow-2xl hover:shadow-orange-500/20 hover:border-orange-500/60 transition-all duration-300 bg-gradient-to-br from-slate-900 to-black/80 backdrop-blur-sm cursor-pointer overflow-hidden border-slate-700 relative hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="p-6 relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(e, workout.id, workout.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <h3 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors">
                        {workout.name}
                      </h3>
                      
                      {workout.description && (
                        <p className="text-muted-foreground line-clamp-2 text-sm mb-4 flex-1">
                          {workout.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-orange-500/10">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {workout.createdAt && format(new Date(workout.createdAt), 'MMM d, yyyy')}
                        </div>
                        <span className="flex items-center text-sm font-medium text-orange-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
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

        <div className="pt-8 border-t border-orange-500/10">
          <DataManagement />
        </div>
      </div>
    </Layout>
  );
}

import { useState, useMemo } from "react";
import { useWorkoutLogs } from "@/hooks/use-workouts";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Trophy, Calendar, Dumbbell, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { WorkoutLog } from "@shared/schema";

interface ExerciseStats {
  name: string;
  logs: WorkoutLog[];
  pr: number;
  lastWeight: number;
  lastReps: number;
  trend: "up" | "down" | "same";
  trendValue: number;
  totalSessions: number;
}

function calculateStats(logs: WorkoutLog[]): Map<string, ExerciseStats> {
  const byExercise = new Map<string, WorkoutLog[]>();
  
  for (const log of logs) {
    const existing = byExercise.get(log.exerciseName) || [];
    existing.push(log);
    byExercise.set(log.exerciseName, existing);
  }

  const stats = new Map<string, ExerciseStats>();
  
  for (const [name, exerciseLogs] of Array.from(byExercise.entries())) {
    const sorted = [...exerciseLogs].sort((a, b) => 
      new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );
    
    const weights = sorted.map(l => l.weight || 0);
    const pr = Math.max(...weights, 0);
    const lastWeight = weights[0] || 0;
    const lastReps = sorted[0]?.reps || 0;
    
    // Calculate 30-day trend
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentLogs = sorted.filter(l => isAfter(new Date(l.completedAt!), thirtyDaysAgo));
    const olderLogs = sorted.filter(l => !isAfter(new Date(l.completedAt!), thirtyDaysAgo));
    
    let trend: "up" | "down" | "same" = "same";
    let trendValue = 0;
    
    if (recentLogs.length > 0 && olderLogs.length > 0) {
      const recentAvg = recentLogs.reduce((sum, l) => sum + (l.weight || 0), 0) / recentLogs.length;
      const olderAvg = olderLogs.reduce((sum, l) => sum + (l.weight || 0), 0) / olderLogs.length;
      trendValue = recentAvg - olderAvg;
      trend = trendValue > 0.5 ? "up" : trendValue < -0.5 ? "down" : "same";
    }
    
    stats.set(name, {
      name,
      logs: sorted,
      pr,
      lastWeight,
      lastReps,
      trend,
      trendValue: Math.abs(trendValue),
      totalSessions: sorted.length,
    });
  }
  
  return stats;
}

function ExerciseProgressCard({ stats }: { stats: ExerciseStats }) {
  const [expanded, setExpanded] = useState(false);
  
  const chartData = useMemo(() => {
    return [...stats.logs]
      .reverse()
      .slice(-10)
      .map(log => ({
        date: format(new Date(log.completedAt!), "MM/dd"),
        weight: log.weight || 0,
        reps: log.reps,
      }));
  }, [stats.logs]);

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
      <div 
        className="p-4 cursor-pointer hover-elevate"
        onClick={() => setExpanded(!expanded)}
        data-testid={`card-exercise-progress-${stats.name.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{stats.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {stats.totalSessions} sessions
              </Badge>
              {stats.pr > 0 && (
                <Badge variant="default" className="bg-amber-500/10 text-amber-500 border-none font-mono text-xs">
                  <Trophy className="w-3 h-3 mr-1" />
                  PR: {stats.pr} kg
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold font-mono">
                {stats.lastWeight > 0 ? `${stats.lastWeight}` : "-"}
                <span className="text-sm text-muted-foreground ml-1">kg</span>
              </div>
              <div className="flex items-center justify-end text-sm">
                {stats.trend === "up" && (
                  <span className="text-green-500 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{stats.trendValue.toFixed(1)} kg
                  </span>
                )}
                {stats.trend === "down" && (
                  <span className="text-red-500 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -{stats.trendValue.toFixed(1)} kg
                  </span>
                )}
                {stats.trend === "same" && (
                  <span className="text-muted-foreground flex items-center">
                    <Minus className="w-3 h-3 mr-1" />
                    Stable
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/30 pt-4">
              {chartData.length > 1 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        stroke="hsl(var(--muted-foreground))"
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                        name="Weight (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Complete more sessions to see your progress chart
                </p>
              )}
              
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Recent Sessions</h4>
                <div className="space-y-1">
                  {stats.logs.slice(0, 5).map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-border/20 last:border-0">
                      <span className="text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {format(new Date(log.completedAt!), "MMM d, yyyy")}
                      </span>
                      <span className="font-mono">
                        {log.sets}x{log.reps} @ {log.weight || 0}kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function Progress() {
  const { data: logs, isLoading } = useWorkoutLogs();

  const exerciseStats = useMemo(() => {
    if (!logs || logs.length === 0) return new Map<string, ExerciseStats>();
    return calculateStats(logs as WorkoutLog[]);
  }, [logs]);

  const sortedStats = useMemo(() => {
    return Array.from(exerciseStats.values()).sort((a, b) => 
      b.totalSessions - a.totalSessions
    );
  }, [exerciseStats]);

  const overallPR = useMemo(() => {
    let max = { name: "", weight: 0 };
    const values = Array.from(exerciseStats.values());
    for (const stats of values) {
      if (stats.pr > max.weight) {
        max = { name: stats.name, weight: stats.pr };
      }
    }
    return max;
  }, [exerciseStats]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Progress Tracker
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Track your strength gains and personal records.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl w-full bg-secondary/50" />
            ))}
          </div>
        ) : sortedStats.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-border/50 bg-secondary/10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No progress data yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Complete your first workout and tap "Log Workout" to start tracking your progress.
            </p>
          </div>
        ) : (
          <>
            {overallPR.weight > 0 && (
              <Card className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Best</p>
                    <p className="text-xl font-bold">
                      {overallPR.name}: <span className="text-amber-500">{overallPR.weight} kg</span>
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                Exercise Progress
              </h2>
              {sortedStats.map((stats) => (
                <motion.div
                  key={stats.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ExerciseProgressCard stats={stats} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

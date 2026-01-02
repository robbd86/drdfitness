import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_TIMES = [30, 60, 90, 120, 180];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function RestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (targetTime && next >= targetTime) {
            setIsRunning(false);
            if ("vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, targetTime]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
    setTargetTime(null);
  }, []);

  const handlePreset = useCallback((time: number) => {
    setSeconds(0);
    setTargetTime(time);
    setIsRunning(true);
  }, []);

  const progress = targetTime ? Math.min((seconds / targetTime) * 100, 100) : 0;
  const isComplete = targetTime && seconds >= targetTime;

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="gap-2"
        data-testid="button-show-timer"
      >
        <Timer className="h-4 w-4" />
        <span className="hidden sm:inline">Rest Timer</span>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-secondary/30 rounded-lg border border-border/50" data-testid="rest-timer">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Rest Timer</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            handleReset();
            setIsExpanded(false);
          }}
          className="text-xs text-muted-foreground"
          data-testid="button-hide-timer"
        >
          Hide
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className="relative">
          <div
            className={cn(
              "text-4xl font-mono font-bold tabular-nums transition-colors",
              isComplete ? "text-green-500" : isRunning ? "text-primary" : "text-foreground"
            )}
            data-testid="timer-display"
          >
            {formatTime(seconds)}
          </div>
          {targetTime && (
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  isComplete ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {targetTime && (
        <div className="text-center text-sm text-muted-foreground">
          {isComplete ? "Rest complete!" : `Target: ${formatTime(targetTime)}`}
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        {isRunning ? (
          <Button
            variant="outline"
            size="icon"
            onClick={handlePause}
            data-testid="button-pause"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={handleStart}
            data-testid="button-start"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          data-testid="button-reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESET_TIMES.map((time) => (
          <Button
            key={time}
            variant="secondary"
            size="sm"
            onClick={() => handlePreset(time)}
            className="text-xs"
            data-testid={`button-preset-${time}`}
          >
            {formatTime(time)}
          </Button>
        ))}
      </div>
    </div>
  );
}

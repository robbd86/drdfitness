import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_TIMES = [30, 60, 90, 120];

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
        className="gap-1.5"
        data-testid="button-show-timer"
      >
        <Timer className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Rest</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg border border-border/50" data-testid="rest-timer">
      <div className="flex items-center gap-2">
        <div className="relative min-w-[52px]">
          <div
            className={cn(
              "text-lg font-mono font-bold tabular-nums transition-colors text-center",
              isComplete ? "text-green-500" : isRunning ? "text-primary" : "text-foreground"
            )}
            data-testid="timer-display"
          >
            {formatTime(seconds)}
          </div>
          {targetTime && (
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-secondary rounded-full overflow-hidden">
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

        {isRunning ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePause}
            data-testid="button-pause"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleStart}
            data-testid="button-start"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleReset}
          data-testid="button-reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {PRESET_TIMES.map((time) => (
          <Button
            key={time}
            variant={targetTime === time ? "default" : "ghost"}
            size="sm"
            className="h-7 px-1.5 sm:px-2 text-xs"
            onClick={() => handlePreset(time)}
            data-testid={`button-preset-${time}`}
          >
            {time < 60 ? `${time}s` : `${time / 60}m`}
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 ml-auto"
        onClick={() => {
          handleReset();
          setIsExpanded(false);
        }}
        data-testid="button-hide-timer"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

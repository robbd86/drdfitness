import * as React from "react";

import { cn } from "@/lib/utils";

export type LoadingButtonProps = {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function LoadingButton({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
  disabled,
  type = "button",
  onClick,
}: LoadingButtonProps) {
  const isDisabled = isLoading || Boolean(disabled);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background gradient-primary text-white",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {isLoading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin text-white"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

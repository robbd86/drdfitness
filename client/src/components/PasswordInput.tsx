import * as React from "react";

import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export type PasswordInputProps = {
  id: string;
  name: string;
  placeholder?: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  autoComplete?: string;
  required?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;
};

export function PasswordInput({
  id,
  name,
  placeholder,
  value,
  onChange,
  className,
  autoComplete,
  required,
  onBlur,
  disabled,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const ariaLabel = showPassword ? "Hide password" : "Show password";

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        type={showPassword ? "text" : "password"}
        className={cn(
          "relative flex h-9 w-full rounded-md border border-slate-700 bg-gradient-to-r from-slate-900 to-black/80 px-3 py-2 pr-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:border-orange-500 focus-visible:shadow-lg focus-visible:shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all md:text-sm hover:border-slate-600",
          className
        )}
      />

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1 text-slate-400 transition-colors hover:bg-orange-500/10 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
        aria-label={ariaLabel}
        aria-pressed={showPassword}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

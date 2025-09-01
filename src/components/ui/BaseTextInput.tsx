import React from "react";
import { cn } from "@/lib/utils";

interface BaseTextInputProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  type?: "text" | "email" | "password" | "url";
  inputMode?: "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
  disabled?: boolean;
  required?: boolean;
}

export function BaseTextInput({ 
  name, 
  value, 
  onChange, 
  onFocus,
  onBlur,
  placeholder,
  className,
  type = "text",
  inputMode,
  disabled,
  required,
  ...rest 
}: BaseTextInputProps) {
  return (
    <input
      name={name}
      type={type}
      inputMode={inputMode}
      value={value ?? ''}
      onChange={(e) => {
        onChange?.(e.currentTarget.value);
      }}
      onFocus={() => {
        onFocus?.();
      }}
      onBlur={() => {
        onBlur?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { 
          e.preventDefault(); 
          e.stopPropagation(); 
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoComplete="off" 
      autoCorrect="off" 
      autoCapitalize="none" 
      enterKeyHint="done"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...rest}
    />
  );
}
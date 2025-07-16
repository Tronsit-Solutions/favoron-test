import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Package, Truck, Clock } from "lucide-react";

interface LoadingStateProps {
  variant?: 'default' | 'card' | 'page' | 'inline' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  icon?: 'spinner' | 'package' | 'truck' | 'clock';
  className?: string;
}

const LoadingState = ({ 
  variant = 'default', 
  size = 'md', 
  message = 'Cargando...', 
  icon = 'spinner',
  className 
}: LoadingStateProps) => {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const getIcon = () => {
    const iconClass = cn("animate-rotate-smooth", iconSizes[size]);
    
    switch (icon) {
      case 'package':
        return <Package className={iconClass} />;
      case 'truck':
        return <Truck className={iconClass} />;
      case 'clock':
        return <Clock className={iconClass} />;
      default:
        return <Loader2 className={iconClass} />;
    }
  };

  if (variant === 'skeleton') {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="shimmer h-4 rounded-md"></div>
        <div className="shimmer h-4 rounded-md w-3/4"></div>
        <div className="shimmer h-4 rounded-md w-1/2"></div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-lg border border-border bg-card",
        "animate-fade-in",
        className
      )}>
        <div className="text-muted-foreground mb-3">
          {getIcon()}
        </div>
        <p className={cn("text-muted-foreground", textSizes[size])}>
          {message}
        </p>
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[50vh] space-y-4",
        "animate-fade-in",
        className
      )}>
        <div className="text-primary">
          {getIcon()}
        </div>
        <div className="text-center space-y-2">
          <p className={cn("text-foreground font-medium", textSizes[size])}>
            {message}
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor espera un momento...
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn(
        "inline-flex items-center space-x-2 text-muted-foreground",
        className
      )}>
        {getIcon()}
        <span className={textSizes[size]}>{message}</span>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex items-center justify-center space-x-3 p-4",
      "animate-fade-in",
      className
    )}>
      <div className="text-primary">
        {getIcon()}
      </div>
      <span className={cn("text-foreground", textSizes[size])}>
        {message}
      </span>
    </div>
  );
};

export { LoadingState };
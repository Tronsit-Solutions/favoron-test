import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle, AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  variant?: 'default' | 'card' | 'page' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  message?: string;
  icon?: 'alert' | 'x-circle' | 'alert-circle';
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  className?: string;
}

const ErrorState = ({
  variant = 'default',
  size = 'md',
  title = 'Error',
  message = 'Algo salió mal. Por favor intenta de nuevo.',
  icon = 'alert',
  showRetry = true,
  showHome = false,
  onRetry,
  onHome,
  className
}: ErrorStateProps) => {
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const messageSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const getIcon = () => {
    const iconClass = cn("text-error", iconSizes[size]);
    
    switch (icon) {
      case 'x-circle':
        return <XCircle className={iconClass} />;
      case 'alert-circle':
        return <AlertCircle className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  const renderActions = () => {
    if (!showRetry && !showHome) return null;

    return (
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        {showRetry && onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            size={size === 'sm' ? 'sm' : 'default'}
            className="interactive-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
        )}
        {showHome && onHome && (
          <Button 
            onClick={onHome}
            variant="default"
            size={size === 'sm' ? 'sm' : 'default'}
            className="interactive-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir al inicio
          </Button>
        )}
      </div>
    );
  };

  if (variant === 'inline') {
    return (
      <div className={cn(
        "inline-flex items-center space-x-2 text-error animate-fade-in",
        className
      )}>
        {getIcon()}
        <span className={messageSizes[size]}>{message}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-lg",
        "border border-error-border bg-error-muted/50",
        "animate-fade-in",
        className
      )}>
        <div className="mb-4">
          {getIcon()}
        </div>
        <div className="text-center space-y-2">
          <h3 className={cn("font-semibold text-error", titleSizes[size])}>
            {title}
          </h3>
          <p className={cn("text-muted-foreground", messageSizes[size])}>
            {message}
          </p>
        </div>
        {renderActions()}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[50vh] space-y-6",
        "animate-fade-in",
        className
      )}>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {getIcon()}
          </div>
          <div className="space-y-2">
            <h2 className={cn("font-bold text-error", titleSizes[size])}>
              {title}
            </h2>
            <p className={cn("text-muted-foreground max-w-md", messageSizes[size])}>
              {message}
            </p>
          </div>
        </div>
        {renderActions()}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex items-start space-x-3 p-4 rounded-lg",
      "border border-error-border bg-error-muted/50",
      "animate-fade-in",
      className
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="space-y-1">
        <h4 className={cn("font-semibold text-error", titleSizes[size])}>
          {title}
        </h4>
        <p className={cn("text-muted-foreground", messageSizes[size])}>
          {message}
        </p>
      </div>
    </div>
  );
};

export { ErrorState };
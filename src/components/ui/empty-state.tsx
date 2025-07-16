import React from "react";
import { cn } from "@/lib/utils";
import { Package, Inbox, Search, Plus, FileX, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  variant?: 'default' | 'card' | 'page';
  size?: 'sm' | 'md' | 'lg';
  icon?: 'package' | 'inbox' | 'search' | 'file' | 'users' | 'map';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showAction?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const EmptyState = ({
  variant = 'default',
  size = 'md',
  icon = 'inbox',
  title = 'No hay elementos',
  description = 'No se encontraron elementos para mostrar.',
  actionLabel = 'Crear nuevo',
  onAction,
  showAction = true,
  className,
  children
}: EmptyStateProps) => {
  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const descriptionSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const getIcon = () => {
    const iconClass = cn("text-muted-foreground/50", iconSizes[size]);
    
    switch (icon) {
      case 'package':
        return <Package className={iconClass} />;
      case 'search':
        return <Search className={iconClass} />;
      case 'file':
        return <FileX className={iconClass} />;
      case 'users':
        return <Users className={iconClass} />;
      case 'map':
        return <MapPin className={iconClass} />;
      default:
        return <Inbox className={iconClass} />;
    }
  };

  const renderAction = () => {
    if (!showAction || !onAction) return null;

    return (
      <Button 
        onClick={onAction}
        className="interactive-full mt-6"
        size={size === 'sm' ? 'sm' : 'default'}
      >
        <Plus className="h-4 w-4 mr-2" />
        {actionLabel}
      </Button>
    );
  };

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-12 rounded-lg",
        "border border-dashed border-border bg-muted/30",
        "animate-fade-in",
        className
      )}>
        <div className="mb-6">
          {getIcon()}
        </div>
        <div className="text-center space-y-3 max-w-sm">
          <h3 className={cn("font-semibold text-muted-foreground", titleSizes[size])}>
            {title}
          </h3>
          <p className={cn("text-muted-foreground/70", descriptionSizes[size])}>
            {description}
          </p>
        </div>
        {children || renderAction()}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] space-y-8",
        "animate-fade-in",
        className
      )}>
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            {getIcon()}
          </div>
          <div className="space-y-3 max-w-md">
            <h2 className={cn("font-bold text-muted-foreground", titleSizes[size])}>
              {title}
            </h2>
            <p className={cn("text-muted-foreground/70 leading-relaxed", descriptionSizes[size])}>
              {description}
            </p>
          </div>
        </div>
        {children || renderAction()}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6",
      "animate-fade-in",
      className
    )}>
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <h3 className={cn("font-semibold text-muted-foreground", titleSizes[size])}>
          {title}
        </h3>
        <p className={cn("text-muted-foreground/70", descriptionSizes[size])}>
          {description}
        </p>
      </div>
      {children || renderAction()}
    </div>
  );
};

export { EmptyState };
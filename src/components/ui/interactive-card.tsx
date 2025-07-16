import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InteractiveCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'press' | 'glow' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

const InteractiveCard = ({
  title,
  description,
  children,
  variant = 'default',
  size = 'md',
  onClick,
  className,
  headerClassName,
  contentClassName,
  disabled = false
}: InteractiveCardProps) => {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const getVariantClasses = () => {
    if (disabled) {
      return 'opacity-50 cursor-not-allowed';
    }

    const baseClasses = onClick ? 'cursor-pointer' : '';

    switch (variant) {
      case 'hover':
        return cn(
          baseClasses,
          'transition-smooth hover:shadow-soft hover:-translate-y-1',
          onClick && 'hover:border-primary/50'
        );
      case 'press':
        return cn(
          baseClasses,
          'transition-fast active:scale-95',
          onClick && 'hover:bg-muted/30'
        );
      case 'glow':
        return cn(
          baseClasses,
          'transition-smooth hover:shadow-glow',
          onClick && 'hover:border-primary/50'
        );
      case 'gradient':
        return cn(
          baseClasses,
          'gradient-card transition-smooth hover:shadow-soft',
          onClick && 'hover:opacity-90'
        );
      default:
        return cn(
          baseClasses,
          onClick && 'hover:bg-muted/30 transition-smooth'
        );
    }
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const cardClasses = cn(
    getVariantClasses(),
    'animate-fade-in',
    className
  );

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
    >
      {(title || description) && (
        <CardHeader className={cn(sizeClasses[size], headerClassName)}>
          {title && (
            <CardTitle className="text-foreground">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        title || description ? sizeClasses[size] : sizeClasses[size],
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};

export { InteractiveCard };
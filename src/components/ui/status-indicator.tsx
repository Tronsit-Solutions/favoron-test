import React from "react";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Package, 
  Truck, 
  Plane,
  Home,
  Users,
  Eye
} from "lucide-react";

type StatusType = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'pending' 
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'delivered'
  | 'in-transit'
  | 'matched'
  | 'active';

interface StatusIndicatorProps {
  status: StatusType;
  variant?: 'dot' | 'badge' | 'pill' | 'card';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

const StatusIndicator = ({
  status,
  variant = 'badge',
  size = 'md',
  label,
  showIcon = true,
  animated = false,
  className
}: StatusIndicatorProps) => {
  const getStatusConfig = (status: StatusType) => {
    const configs = {
      success: {
        color: 'success',
        icon: CheckCircle,
        defaultLabel: 'Exitoso'
      },
      warning: {
        color: 'warning',
        icon: AlertCircle,
        defaultLabel: 'Advertencia'
      },
      error: {
        color: 'error',
        icon: XCircle,
        defaultLabel: 'Error'
      },
      info: {
        color: 'info',
        icon: Eye,
        defaultLabel: 'Información'
      },
      pending: {
        color: 'warning',
        icon: Clock,
        defaultLabel: 'Pendiente'
      },
      processing: {
        color: 'info',
        icon: Package,
        defaultLabel: 'Procesando'
      },
      approved: {
        color: 'success',
        icon: CheckCircle,
        defaultLabel: 'Aprobado'
      },
      rejected: {
        color: 'error',
        icon: XCircle,
        defaultLabel: 'Rechazado'
      },
      delivered: {
        color: 'success',
        icon: Home,
        defaultLabel: 'Entregado'
      },
      'in-transit': {
        color: 'info',
        icon: Truck,
        defaultLabel: 'En tránsito'
      },
      matched: {
        color: 'info',
        icon: Users,
        defaultLabel: 'Emparejado'
      },
      active: {
        color: 'success',
        icon: CheckCircle,
        defaultLabel: 'Activo'
      }
    };

    return configs[status] || configs.info;
  };

  const config = getStatusConfig(status);
  const displayLabel = label || config.defaultLabel;
  const Icon = config.icon;

  const sizeClasses = {
    dot: {
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4'
    },
    icon: {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    },
    text: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    }
  };

  if (variant === 'dot') {
    return (
      <div className={cn(
        "inline-flex items-center space-x-2",
        className
      )}>
        <div 
          className={cn(
            "rounded-full flex-shrink-0",
            `bg-${config.color}`,
            sizeClasses.dot[size],
            animated && 'animate-pulse-soft'
          )}
        />
        {label && (
          <span className={cn("text-foreground", sizeClasses.text[size])}>
            {displayLabel}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={cn(
        "inline-flex items-center px-3 py-1 rounded-full border",
        `bg-${config.color}-muted border-${config.color}-border text-${config.color}`,
        sizeClasses.text[size],
        "font-medium",
        animated && 'animate-fade-in',
        className
      )}>
        {showIcon && <Icon className={cn("mr-1.5", sizeClasses.icon[size])} />}
        {displayLabel}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex items-center p-3 rounded-lg border",
        `bg-${config.color}-muted border-${config.color}-border`,
        animated && 'animate-slide-up',
        className
      )}>
        {showIcon && (
          <div className={cn(`text-${config.color}`, "mr-3")}>
            <Icon className={sizeClasses.icon[size]} />
          </div>
        )}
        <span className={cn(
          `text-${config.color}`,
          "font-medium",
          sizeClasses.text[size]
        )}>
          {displayLabel}
        </span>
      </div>
    );
  }

  // Default badge variant
  return (
    <div className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-md border",
      `bg-${config.color}-muted border-${config.color}-border text-${config.color}`,
      sizeClasses.text[size],
      "font-medium",
      animated && 'animate-fade-in',
      className
    )}>
      {showIcon && <Icon className={cn("mr-1.5", sizeClasses.icon[size])} />}
      {displayLabel}
    </div>
  );
};

export { StatusIndicator, type StatusType };
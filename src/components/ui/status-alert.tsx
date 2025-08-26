import { CheckCircle, AlertCircle, Info, Clock } from "lucide-react";
import { ReactNode } from "react";

interface StatusAlertProps {
  variant: 'success' | 'warning' | 'info' | 'pending';
  title?: string;
  children: ReactNode;
  showIcon?: boolean;
}

const StatusAlert = ({ variant, title, children, showIcon = true }: StatusAlertProps) => {
  const variantStyles = {
    success: 'bg-success-muted border-success-border text-success-foreground',
    warning: 'bg-warning-muted border-warning-border text-warning-foreground',
    info: 'bg-info-muted border-info-border text-info-foreground',
    pending: 'bg-muted border-border text-muted-foreground'
  };

  const icons = {
    success: CheckCircle,
    warning: AlertCircle,
    info: Info,
    pending: Clock
  };

  const iconColors = {
    success: 'text-success',
    warning: 'text-warning', 
    info: 'text-info',
    pending: 'text-muted-foreground'
  };

  const Icon = icons[variant];

  return (
    <div className={`${variantStyles[variant]} border rounded-md p-3 text-black`}>
      <div className="flex items-start space-x-2">
        {showIcon && <Icon className={`h-3.5 w-3.5 ${iconColors[variant]} mt-0.5 flex-shrink-0`} />}
        <div className="flex-1 min-w-0">
          {title && <p className="text-xs font-semibold mb-1 leading-tight">{title}</p>}
          <div className="text-xs leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default StatusAlert;
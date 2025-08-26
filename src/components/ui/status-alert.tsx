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
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    pending: 'bg-gray-50 border-gray-200'
  };

  const icons = {
    success: CheckCircle,
    warning: AlertCircle,
    info: Info,
    pending: Clock
  };

  const iconColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600', 
    info: 'text-blue-600',
    pending: 'text-gray-500'
  };

  const Icon = icons[variant];

  return (
    <div className={`${variantStyles[variant]} border rounded-lg p-4 shadow-sm`}>
      <div className="flex items-start space-x-3">
        {showIcon && <Icon className={`h-4 w-4 ${iconColors[variant]} mt-0.5 flex-shrink-0`} />}
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-semibold mb-2 leading-tight text-black">{title}</p>}
          <div className="text-sm leading-relaxed text-black">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default StatusAlert;
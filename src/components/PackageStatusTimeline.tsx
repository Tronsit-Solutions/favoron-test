
import { Check, Circle, Package, CreditCard, Truck, Home } from "lucide-react";

interface PackageStatusTimelineProps {
  currentStatus: string;
  className?: string;
}

const PackageStatusTimeline = ({ currentStatus, className = "" }: PackageStatusTimelineProps) => {
  const statuses = [
    { key: 'pending_approval', label: 'Solicitud creada', icon: Circle },
    { key: 'approved', label: 'Aprobada', icon: Check },
    { key: 'matched', label: 'Emparejada', icon: Package },
    { key: 'quote_accepted', label: 'Cotización aceptada', icon: Check },
    { key: 'paid', label: 'Pagado', icon: CreditCard },
    { key: 'purchased', label: 'Comprado', icon: Package },
    { key: 'in_transit', label: 'En tránsito', icon: Truck },
    { key: 'delivered', label: 'Entregado', icon: Home },
  ];

  const currentIndex = statuses.findIndex(status => status.key === currentStatus);

  const getStatusState = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h4 className="font-medium text-sm text-muted-foreground">Estado del paquete</h4>
      <div className="space-y-3">
        {statuses.map((status, index) => {
          const state = getStatusState(index);
          const Icon = status.icon;
          
          return (
            <div key={status.key} className="flex items-center space-x-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 
                ${state === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : state === 'current'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-background border-muted-foreground text-muted-foreground'
                }
              `}>
                {state === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  state === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                }`}>
                  {status.label}
                </p>
              </div>
              
              {index < currentIndex && (
                <div className="text-xs text-green-600 font-medium">✓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PackageStatusTimeline;

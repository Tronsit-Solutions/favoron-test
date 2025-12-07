
import { Check, Clock, Package, Truck } from "lucide-react";

interface TravelerPackageTimelineProps {
  currentStatus: string;
  className?: string;
}

const TravelerPackageTimeline = ({ currentStatus, className = "" }: TravelerPackageTimelineProps) => {
  const travelerStatuses = [
    { 
      key: 'quote_accepted', 
      label: 'Cotización aceptada', 
      icon: Check,
      description: 'El shopper aceptó tu cotización'
    },
    { 
      key: 'pending_purchase', 
      label: 'Pago confirmado', 
      icon: Package,
      description: 'Admin confirmó el pago del shopper'
    },
    { 
      key: 'in_transit', 
      label: 'Paquete en tránsito', 
      icon: Truck,
      description: 'El shopper envió el paquete'
    },
  ];

  const currentIndex = travelerStatuses.findIndex(status => status.key === currentStatus);

  const getStatusState = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Package className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-medium text-blue-800">Estado del paquete para ti:</p>
      </div>
      
      <div className="space-y-2 ml-6">
        {travelerStatuses.map((status, index) => {
          const state = getStatusState(index);
          const Icon = status.icon;
          
          return (
            <div key={status.key} className="flex items-center space-x-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center border-2 
                ${state === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : state === 'current'
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-background border-gray-300 text-gray-400'
                }
              `}>
                {state === 'completed' ? (
                  <Check className="h-3 w-3" />
                ) : state === 'current' ? (
                  <Icon className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
              </div>
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  state === 'pending' ? 'text-gray-500' : 'text-blue-800'
                }`}>
                  {status.label}
                </p>
                <p className={`text-xs ${
                  state === 'pending' ? 'text-gray-400' : 'text-blue-600'
                }`}>
                  {status.description}
                </p>
              </div>
              
              {state === 'completed' && (
                <div className="text-xs text-green-600 font-medium">✓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TravelerPackageTimeline;

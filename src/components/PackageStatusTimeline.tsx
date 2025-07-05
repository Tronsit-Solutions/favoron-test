
import { Check, Clock, Package, Truck, MapPin, Building } from "lucide-react";

interface PackageStatusTimelineProps {
  currentStatus: string;
  className?: string;
}

const PackageStatusTimeline = ({ currentStatus, className = "" }: PackageStatusTimelineProps) => {
  const statuses = [
    { 
      key: 'pending_approval', 
      label: 'Solicitud creada', 
      icon: Package,
      description: 'Tu solicitud está en revisión'
    },
    { 
      key: 'approved', 
      label: 'Aprobada', 
      icon: Check,
      description: 'Solicitud aprobada por el equipo'
    },
    { 
      key: 'matched', 
      label: 'Match realizado', 
      icon: MapPin,
      description: 'Emparejado con un viajero'
    },
    { 
      key: 'quote_accepted', 
      label: 'Cotización aceptada', 
      icon: Check,
      description: 'Aceptaste la cotización del viajero'
    },
    { 
      key: 'payment_confirmed', 
      label: 'Pago confirmado', 
      icon: Check,
      description: 'Tu pago fue confirmado'
    },
    { 
      key: 'purchased', 
      label: 'Comprado', 
      icon: Package,
      description: 'El producto fue comprado'
    },
    { 
      key: 'in_transit', 
      label: 'En tránsito', 
      icon: Truck,
      description: 'El paquete está en camino al viajero'
    },
    { 
      key: 'received_by_traveler', 
      label: 'Recibido por viajero', 
      icon: Package,
      description: 'El viajero recibió tu paquete'
    },
    { 
      key: 'delivered', 
      label: 'Entregado en oficina', 
      icon: Building,
      description: 'Disponible en oficina de Favorón'
    }
  ];

  const currentIndex = statuses.findIndex(status => status.key === currentStatus);

  const getStatusState = (index: number) => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={`bg-shopper-hover border border-shopper/20 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Package className="h-4 w-4 text-shopper" />
        <p className="text-sm font-medium text-shopper">Estado de tu pedido:</p>
      </div>
      
      <div className="space-y-2 ml-6">
        {statuses.map((status, index) => {
          const state = getStatusState(index);
          const Icon = status.icon;
          
          return (
            <div key={status.key} className="flex items-center space-x-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center border-2 
                ${state === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : state === 'current'
                  ? 'bg-shopper border-shopper text-white'
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
                  state === 'pending' ? 'text-gray-500' : 'text-shopper'
                }`}>
                  {status.label}
                </p>
                <p className={`text-xs ${
                  state === 'pending' ? 'text-gray-400' : 'text-shopper'
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

export default PackageStatusTimeline;

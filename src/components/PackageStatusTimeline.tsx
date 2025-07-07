
import React from "react";
import { Check, Clock, Package, Truck, MapPin, Building, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PackageStatusTimelineProps {
  currentStatus: string;
  className?: string;
}

const PackageStatusTimeline = ({ currentStatus, className = "" }: PackageStatusTimelineProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

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
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-800">Estado de tu pedido:</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Horizontal progress bar - always visible */}
      <div className="flex items-center justify-between mb-3">
        {statuses.map((status, index) => {
          const state = getStatusState(index);
          const Icon = status.icon;
          const isLast = index === statuses.length - 1;
          
          return (
            <div key={status.key} className="flex items-center flex-1">
              {/* Status icon */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0
                ${state === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : state === 'current'
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-background border-gray-300 text-gray-400'
                }
              `}>
                {state === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : state === 'current' ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              
              {/* Connecting line */}
              {!isLast && (
                <div className={`
                  flex-1 h-0.5 mx-2
                  ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {statuses.map((status, index) => {
            const state = getStatusState(index);
            
            return (
              <div key={status.key} className={`
                p-2 rounded border
                ${state === 'completed' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : state === 'current'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
                }
              `}>
                <p className="font-medium">{status.label}</p>
                <p className="text-xs opacity-75">{status.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PackageStatusTimeline;

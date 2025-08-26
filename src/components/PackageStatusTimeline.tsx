import { Check, Clock, Package, Truck, MapPin, Building } from "lucide-react";

interface PackageStatusTimelineProps {
  currentStatus: string;
  deliveryMethod?: string;
  className?: string;
}

const PackageStatusTimeline = ({ currentStatus, deliveryMethod, className = "" }: PackageStatusTimelineProps) => {
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
      key: 'quote_sent', 
      label: 'Cotización enviada', 
      icon: Clock,
      description: 'El viajero envió una cotización'
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
      key: 'pending_purchase', 
      label: 'Pendiente de Compra', 
      icon: Clock,
      description: 'Debes realizar la compra del producto'
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
      key: 'pending_office_confirmation', 
      label: 'Pendiente confirmación oficina', 
      icon: Clock,
      description: 'Esperando confirmación de oficina'
    },
    { 
      key: 'delivered_to_office', 
      label: 'Entregado en oficina', 
      icon: Building,
      description: 'Disponible en oficina de Favorón'
    },
    { 
      key: 'out_for_delivery', 
      label: 'En reparto', 
      icon: Truck,
      description: 'En camino para entrega'
    },
    { 
      key: 'completed', 
      label: 'Completado', 
      icon: Check,
      description: 'Paquete entregado exitosamente'
    }
  ];

  // Filter out "out_for_delivery" status when delivery method is pickup
  const filteredStatuses = statuses.filter(status => {
    if (status.key === 'out_for_delivery' && deliveryMethod === 'pickup') {
      return false;
    }
    return true;
  });

  const currentIndex = filteredStatuses.findIndex(status => status.key === currentStatus);

  const getStatusState = (index: number) => {
    // Si el paquete está completado, todos los pasos se muestran como completados
    if (currentStatus === 'completed') return 'completed';
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-2 w-full ${className}`}>
      <div className="flex items-center space-x-1.5 mb-2">
        <Package className="h-3 w-3 text-blue-600" />
        <p className="text-xs font-medium text-blue-800">Estado del Paquete</p>
      </div>
      
      <div className="space-y-1">
        {filteredStatuses.map((status, index) => {
          const state = getStatusState(index);
          const Icon = status.icon;
          
          return (
            <div key={status.key} className="flex items-center space-x-2">
              <div className={`
                w-4 h-4 rounded-full flex items-center justify-center border flex-shrink-0
                ${state === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : state === 'current'
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-background border-gray-300 text-gray-400'
                }
              `}>
                {state === 'completed' ? (
                  <Check className="h-2 w-2" />
                ) : state === 'current' ? (
                  <Icon className="h-2 w-2" />
                ) : (
                  <Clock className="h-2 w-2" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${
                  state === 'pending' ? 'text-gray-500' : 'text-blue-800'
                }`}>
                  {status.label}
                </p>
                {state === 'current' && (
                  <p className="text-[10px] text-blue-600 mt-0.5">
                    {status.description}
                  </p>
                )}
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

import React from 'react';
import { AlertTriangle, MapPin, Calendar, CalendarRange, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTripChangeAlerts, TripChangeType } from '@/hooks/useTripChangeAlerts';

interface TripChangeAlertBadgeProps {
  packageId: string;
  compact?: boolean;
}

const getChangeInfo = (changeType: TripChangeType | undefined) => {
  switch (changeType) {
    case 'address':
      return {
        icon: MapPin,
        label: 'Dirección actualizada',
        description: 'El viajero cambió la dirección donde recibirá tus productos'
      };
    case 'delivery_date':
      return {
        icon: Calendar,
        label: 'Fecha de entrega cambió',
        description: 'El viajero modificó la fecha de entrega en oficina'
      };
    case 'receiving_window':
      return {
        icon: CalendarRange,
        label: 'Ventana recepción cambió',
        description: 'El viajero actualizó las fechas para recibir paquetes'
      };
    default:
      return {
        icon: AlertTriangle,
        label: 'Viaje actualizado',
        description: 'El viajero hizo cambios en el viaje'
      };
  }
};

export function TripChangeAlertBadge({ packageId, compact = false }: TripChangeAlertBadgeProps) {
  const { hasUnreadChanges, changeType, markAsSeen, loading } = useTripChangeAlerts(packageId);

  if (loading || !hasUnreadChanges) {
    return null;
  }

  const { icon: Icon, label, description } = getChangeInfo(changeType);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsSeen();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>⚠️</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                {label}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
              <p className="text-xs text-muted-foreground italic">Toca para marcar como visto</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800"
      onClick={(e) => e.stopPropagation()}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </p>
        <p className="text-xs text-amber-700 truncate">{description}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          markAsSeen();
        }}
        className="h-6 w-6 p-0 hover:bg-amber-100 flex-shrink-0"
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Marcar como visto</span>
      </Button>
    </div>
  );
}

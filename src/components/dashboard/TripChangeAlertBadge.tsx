import React from 'react';
import { AlertTriangle, MapPin, Calendar, CalendarRange, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTripChangeAlerts, TripChangeType } from '@/hooks/useTripChangeAlerts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
        description: 'El viajero cambió la dirección donde recibirá tus productos.',
        hint: 'Revisa los nuevos detalles en la información de envío.'
      };
    case 'delivery_date':
      return {
        icon: Calendar,
        label: 'Fecha de entrega cambió',
        description: 'El viajero modificó la fecha de entrega en oficina.',
        hint: 'Verifica que la nueva fecha funcione para ti.'
      };
    case 'receiving_window':
      return {
        icon: CalendarRange,
        label: 'Ventana de recepción cambió',
        description: 'El viajero actualizó las fechas para recibir paquetes.',
        hint: 'Asegúrate de enviar tu producto dentro del nuevo rango.'
      };
    default:
      return {
        icon: AlertTriangle,
        label: 'Viaje actualizado',
        description: 'El viajero hizo cambios importantes en el viaje.',
        hint: 'Revisa los detalles actualizados del envío.'
      };
  }
};

export function TripChangeAlertBadge({ packageId, compact = false }: TripChangeAlertBadgeProps) {
  const { hasUnreadChanges, changeType, changedAt, loading } = useTripChangeAlerts(packageId);

  if (loading || !hasUnreadChanges) {
    return null;
  }

  const { icon: Icon, label, description, hint } = getChangeInfo(changeType);
  
  const formattedTime = changedAt 
    ? formatDistanceToNow(new Date(changedAt), { addSuffix: true, locale: es })
    : null;

  const popoverContent = (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-amber-700">
        <Icon className="h-5 w-5" />
        <span className="font-semibold">{label}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <p className="text-sm text-muted-foreground">{hint}</p>
      {formattedTime && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
          <Clock className="h-3 w-3" />
          <span>{formattedTime}</span>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors"
          >
            <AlertTriangle className="h-3 w-3" />
            <span>⚠️</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-72" onClick={(e) => e.stopPropagation()}>
          {popoverContent}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors w-full text-left"
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
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}

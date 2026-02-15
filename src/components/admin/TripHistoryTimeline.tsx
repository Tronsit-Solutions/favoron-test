import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  PlaneTakeoff, Edit, CheckCircle, XCircle, Package, PackageMinus, 
  ArrowRightLeft, Clock 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TripHistoryEntry, fieldLabelMap } from '@/utils/tripHistoryHelpers';
import { formatDateUTC } from '@/lib/formatters';

interface TripHistoryTimelineProps {
  historyLog: TripHistoryEntry[] | null;
}

const eventConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  trip_created: { icon: PlaneTakeoff, label: 'Viaje creado', color: 'text-green-600' },
  trip_edited: { icon: Edit, label: 'Viaje editado', color: 'text-amber-600' },
  trip_approved: { icon: CheckCircle, label: 'Viaje aprobado', color: 'text-green-600' },
  trip_rejected: { icon: XCircle, label: 'Viaje rechazado', color: 'text-destructive' },
  package_assigned: { icon: Package, label: 'Paquete asignado', color: 'text-blue-600' },
  package_unassigned: { icon: PackageMinus, label: 'Paquete desasociado', color: 'text-orange-600' },
  status_change: { icon: ArrowRightLeft, label: 'Cambio de estado', color: 'text-muted-foreground' },
};

const formatFieldValue = (field: string, value: any): string => {
  if (value === null || value === undefined) return 'No especificado';
  if (field.includes('date') || field.includes('day_packages')) {
    try {
      return formatDateUTC(value);
    } catch {
      return String(value);
    }
  }
  if (field === 'available_space') return `${value} kg`;
  if (field === 'delivery_method') {
    const methods: Record<string, string> = {
      oficina: 'Oficina',
      mensajero: 'Mensajero',
      pickup: 'Recoger en oficina',
    };
    return methods[value] || value;
  }
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 80) + '...';
  return String(value);
};

export function TripHistoryTimeline({ historyLog }: TripHistoryTimelineProps) {
  if (!historyLog || !Array.isArray(historyLog) || historyLog.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Clock className="h-4 w-4" />
            <span>Historial del Viaje</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin historial registrado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show newest first
  const sortedLog = [...historyLog].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Clock className="h-4 w-4" />
          <span>Historial del Viaje ({historyLog.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
          
          {sortedLog.map((entry, index) => {
            const config = eventConfig[entry.event_type] || eventConfig.status_change;
            const Icon = config.icon;

            return (
              <div key={index} className="relative pl-8 pb-4 last:pb-0">
                {/* Timeline dot */}
                <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 bg-background ${config.color} border-current`} />
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    <span className="text-sm font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.timestamp), "dd MMM yy, HH:mm", { locale: es })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    por {entry.actor_name}
                  </p>

                  {/* Event-specific details */}
                  {entry.event_type === 'trip_edited' && entry.details?.changed_fields && (
                    <div className="mt-1 space-y-1 bg-amber-50 border border-amber-200 rounded p-2">
                      {entry.details.changed_fields.map((field: string) => (
                        <div key={field} className="text-xs">
                          <span className="font-medium">{fieldLabelMap[field] || field}:</span>{' '}
                          <span className="text-destructive line-through">
                            {formatFieldValue(field, entry.details.previous_values?.[field])}
                          </span>
                          {' → '}
                          <span className="text-green-700">
                            {formatFieldValue(field, entry.details.new_values?.[field])}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {entry.event_type === 'trip_rejected' && entry.details?.reason && (
                    <div className="mt-1 bg-destructive/10 border border-destructive/20 rounded p-2">
                      <p className="text-xs"><span className="font-medium">Razón:</span> {entry.details.reason}</p>
                    </div>
                  )}

                  {entry.event_type === 'package_assigned' && (
                    <div className="mt-1 bg-blue-50 border border-blue-200 rounded p-2 text-xs space-y-0.5">
                      <p><span className="font-medium">Paquete:</span> {entry.details?.item_description}</p>
                      <p><span className="font-medium">Shopper:</span> {entry.details?.shopper_name}</p>
                      {entry.details?.admin_tip && (
                        <p><span className="font-medium">Tip:</span> Q{entry.details.admin_tip}</p>
                      )}
                    </div>
                  )}

                  {entry.event_type === 'package_unassigned' && (
                    <div className="mt-1 bg-orange-50 border border-orange-200 rounded p-2 text-xs space-y-0.5">
                      <p><span className="font-medium">Paquete:</span> {entry.details?.item_description}</p>
                      {entry.details?.reason && (
                        <p><span className="font-medium">Razón:</span> {entry.details.reason}</p>
                      )}
                    </div>
                  )}

                  {entry.event_type === 'trip_created' && (
                    <div className="mt-1 bg-green-50 border border-green-200 rounded p-2 text-xs">
                      <p>{entry.details?.from_city} → {entry.details?.to_city}</p>
                      {entry.details?.available_space && (
                        <p>Espacio: {entry.details.available_space} kg</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

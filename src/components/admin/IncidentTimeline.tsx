import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, RotateCcw, Clock, MessageSquare } from 'lucide-react';

export interface IncidentHistoryEntry {
  action: 'marked' | 'resolved' | 'reopened' | 'comment';
  timestamp: string;
  admin_id: string;
  admin_name?: string;
  reason?: string;
  resolution_notes?: string;
  note?: string;
}

interface IncidentTimelineProps {
  history: IncidentHistoryEntry[];
  className?: string;
}

const actionConfig: Record<string, {
  label: string;
  Icon: typeof AlertTriangle;
  color: string;
  badgeVariant: 'destructive' | 'default' | 'secondary';
}> = {
  marked: {
    label: 'Incidencia marcada',
    Icon: AlertTriangle,
    color: 'text-destructive',
    badgeVariant: 'destructive',
  },
  resolved: {
    label: 'Incidencia resuelta',
    Icon: CheckCircle,
    color: 'text-green-600',
    badgeVariant: 'default',
  },
  reopened: {
    label: 'Incidencia reabierta',
    Icon: RotateCcw,
    color: 'text-amber-600',
    badgeVariant: 'secondary',
  },
  comment: {
    label: 'Comentario',
    Icon: MessageSquare,
    color: 'text-blue-600',
    badgeVariant: 'secondary',
  },
};

const IncidentTimeline = ({ history, className }: IncidentTimelineProps) => {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">Sin historial de incidencias</p>
    );
  }

  // Show newest first
  const sorted = [...history].reverse();

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {sorted.map((entry, idx) => {
        const config = actionConfig[entry.action] || actionConfig.marked;
        const date = new Date(entry.timestamp);
        const formattedDate = date.toLocaleDateString('es-GT', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });

        return (
          <div key={idx} className="relative pl-6 pb-3 last:pb-0">
            {/* Vertical line */}
            {idx < sorted.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />
            )}
            {/* Dot */}
            <div className={`absolute left-0 top-1 h-[22px] w-[22px] rounded-full border-2 border-background flex items-center justify-center ${
              entry.action === 'resolved' ? 'bg-green-100' : entry.action === 'reopened' ? 'bg-amber-100' : entry.action === 'comment' ? 'bg-blue-100' : 'bg-red-100'
            }`}>
              <config.Icon className={`h-3 w-3 ${config.color}`} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.label}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formattedDate}
                </span>
              </div>

              {entry.admin_name && (
                <p className="text-xs text-muted-foreground">Por: {entry.admin_name}</p>
              )}

              {entry.reason && (
                <div className="bg-muted/50 rounded p-2 text-sm">
                  <span className="font-medium text-xs text-muted-foreground">Razón: </span>
                  {entry.reason}
                </div>
              )}

              {entry.resolution_notes && (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-sm">
                  <span className="font-medium text-xs text-green-700">Resolución: </span>
                  {entry.resolution_notes}
                </div>
              )}

              {entry.note && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                  <span className="font-medium text-xs text-blue-700">Nota: </span>
                  {entry.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IncidentTimeline;

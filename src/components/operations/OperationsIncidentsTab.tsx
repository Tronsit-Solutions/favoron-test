import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, User, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OperationsPackage } from '@/hooks/useOperationsData';

interface OperationsIncidentsTabProps {
  packages: OperationsPackage[];
  loading: boolean;
  onRefresh: () => void;
}

const statusLabels: Record<string, string> = {
  in_transit: 'En tránsito',
  received_by_traveler: 'Recibido por viajero',
  pending_office_confirmation: 'Pendiente confirmación',
  delivered_to_office: 'En oficina',
  ready_for_pickup: 'Listo para recoger',
  ready_for_delivery: 'Listo para envío',
  paid: 'Pagado',
  pending_purchase: 'Pendiente compra',
  purchased: 'Comprado',
};

const OperationsIncidentsTab = ({ packages, loading, onRefresh }: OperationsIncidentsTabProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay incidencias activas</p>
            <p className="text-sm">Los paquetes con incidencias aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeIncidents = packages.filter(p => p.incident_status === 'active');
  const resolvedIncidents = packages.filter(p => p.incident_status === 'resolved');

  const getLastHistoryEntry = (history: any[]) => {
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  };

  const PackageCard = ({ pkg }: { pkg: OperationsPackage }) => {
    const isActive = pkg.incident_status === 'active';
    const lastEntry = getLastHistoryEntry(pkg.incident_history);
    const lastDate = lastEntry?.timestamp
      ? new Date(lastEntry.timestamp).toLocaleDateString('es-GT', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : null;

    return (
      <Card className={`overflow-hidden border-l-4 ${isActive ? 'border-l-destructive' : 'border-l-warning'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {pkg.label_number && (
                <Badge variant="outline" className="font-mono">
                  🏷️ #{pkg.label_number}
                </Badge>
              )}
              <Badge variant={isActive ? 'destructive' : 'warning'}>
                {isActive ? 'Activa' : 'Resuelta'}
              </Badge>
            </div>
            <Badge variant="muted">
              {statusLabels[pkg.status] || pkg.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <User className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{pkg.shopper_name}</span>
          </div>

          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            <span className="truncate">{pkg.item_description}</span>
          </div>

          {pkg.traveler_name && (
            <div className="text-sm text-muted-foreground">
              Viajero: <span className="text-foreground">{pkg.traveler_name}</span>
            </div>
          )}

          {lastEntry && (
            <div className={`rounded p-2 text-sm ${isActive ? 'bg-destructive/10' : 'bg-warning/10'}`}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" />
                {lastDate}
                {lastEntry.admin_name && <span>· {lastEntry.admin_name}</span>}
              </div>
              <p className="text-sm">
                {lastEntry.reason || lastEntry.resolution_notes || 'Sin detalle'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Incidencias ({packages.length})
        </h2>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {activeIncidents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Activas ({activeIncidents.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeIncidents.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}

      {resolvedIncidents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Resueltas ({resolvedIncidents.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resolvedIncidents.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsIncidentsTab;

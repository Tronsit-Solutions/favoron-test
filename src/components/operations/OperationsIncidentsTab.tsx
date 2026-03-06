import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, User, Clock, Loader2, RefreshCw, CheckCircle, RotateCcw, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OperationsPackage } from '@/hooks/useOperationsData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import IncidentReasonModal, { IncidentAction } from '@/components/admin/IncidentReasonModal';
import IncidentTimeline from '@/components/admin/IncidentTimeline';

interface OperationsIncidentsTabProps {
  packages: OperationsPackage[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateIncidentFlag: (packageId: string, flag: boolean, status?: string | null, history?: any[]) => void;
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

const OperationsIncidentsTab = ({ packages, loading, onRefresh, onUpdateIncidentFlag }: OperationsIncidentsTabProps) => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<IncidentAction>('resolve');
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [expandedTimelines, setExpandedTimelines] = useState<Set<string>>(new Set());

  const toggleTimeline = (id: string) => {
    setExpandedTimelines(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openModal = (pkgId: string, action: IncidentAction) => {
    setSelectedPkgId(pkgId);
    setModalAction(action);
    setModalOpen(true);
  };

  const handleIncidentAction = async (text: string) => {
    if (!selectedPkgId || !user) return;

    const { data: currentPkg } = await supabase
      .from('packages')
      .select('incident_history')
      .eq('id', selectedPkgId)
      .single();

    const currentHistory: any[] = (currentPkg?.incident_history as any[]) || [];

    const newEntry = {
      action: modalAction === 'resolve' ? 'resolved' : modalAction === 'comment' ? 'comment' : 'reopened',
      timestamp: new Date().toISOString(),
      admin_id: user.id,
      admin_name: 'Operaciones',
      ...(modalAction === 'resolve' ? { resolution_notes: text } : modalAction === 'comment' ? { note: text } : { reason: text }),
    };

    const updatedHistory = [...currentHistory, newEntry];

    if (modalAction === 'comment') {
      const { error } = await supabase
        .from('packages')
        .update({ incident_history: updatedHistory })
        .eq('id', selectedPkgId);
      if (error) throw error;
      toast.success('Comentario agregado');
      onUpdateIncidentFlag(selectedPkgId, true, null, updatedHistory);
    } else {
      const newStatus = modalAction === 'resolve' ? 'resolved' : 'active';
      const { error } = await supabase
        .from('packages')
        .update({
          incident_flag: true,
          incident_status: newStatus,
          incident_history: updatedHistory,
        })
        .eq('id', selectedPkgId);
      if (error) throw error;
      toast.success(modalAction === 'resolve' ? 'Incidencia resuelta' : 'Incidencia reabierta');
      onUpdateIncidentFlag(selectedPkgId, true, newStatus, updatedHistory);
    }
  };

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
    const isTimelineExpanded = expandedTimelines.has(pkg.id);

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
        <CardContent className="space-y-3">
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

          {/* Timeline toggle */}
          {pkg.incident_history && pkg.incident_history.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => toggleTimeline(pkg.id)}
              >
                {isTimelineExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {isTimelineExpanded ? 'Ocultar historial' : `Ver historial (${pkg.incident_history.length})`}
              </Button>
              {isTimelineExpanded && (
                <div className="border rounded-lg p-3">
                  <IncidentTimeline history={pkg.incident_history} />
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {isActive ? (
              <Button
                size="sm"
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => openModal(pkg.id, 'resolve')}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Resolver
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => openModal(pkg.id, 'reopen')}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reabrir
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => openModal(pkg.id, 'comment')}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Comentar
            </Button>
          </div>
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

      <IncidentReasonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleIncidentAction}
        action={modalAction}
      />
    </div>
  );
};

export default OperationsIncidentsTab;

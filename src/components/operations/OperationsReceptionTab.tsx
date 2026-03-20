import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import OperationsTripCard from './OperationsTripCard';
import { TripGroup } from '@/hooks/useOperationsData';

interface OperationsReceptionTabProps {
  tripGroups: TripGroup[];
  loading: boolean;
  onRefresh: () => void;
  onRemovePackage: (id: string) => void;
  onRemovePackages: (ids: string[]) => void;
  onUpdatePackageStatus: (id: string, status: string) => void;
  onUpdateIncidentFlag: (id: string, flag: boolean) => void;
  onAddToLabelCart: (packageId: string) => Promise<void>;
  onAddManyToLabelCart: (packageIds: string[]) => Promise<void>;
}

const OperationsReceptionTab = ({ 
  tripGroups, 
  loading, 
  onRefresh,
  onRemovePackage,
  onRemovePackages,
  onUpdateIncidentFlag,
  onAddToLabelCart,
  onAddManyToLabelCart,
}: OperationsReceptionTabProps) => {
  const { user } = useAuth();
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());
  const [markingIncidentIds, setMarkingIncidentIds] = useState<Set<string>>(new Set());

  const handleConfirmPackage = async (packageId: string) => {
    if (!user) return;

    setConfirmingIds(prev => new Set(prev).add(packageId));
    try {
      const { error } = await supabase.rpc('admin_confirm_office_delivery', {
        _package_id: packageId,
        _admin_id: user.id,
      });

      if (error) throw error;

      toast.success('Paquete confirmado');
      // Add to label cart before removing from view
      await onAddToLabelCart(packageId);
      onRemovePackage(packageId);
    } catch (error: any) {
      console.error('Error confirming package:', error);
      toast.error(error.message || 'Error al confirmar');
    } finally {
      setConfirmingIds(prev => {
        const next = new Set(prev);
        next.delete(packageId);
        return next;
      });
    }
  };

  const handleConfirmAll = async (packageIds: string[]) => {
    if (!user || packageIds.length === 0) return;

    setConfirmingIds(prev => {
      const next = new Set(prev);
      packageIds.forEach(id => next.add(id));
      return next;
    });

    const confirmed: string[] = [];
    const failed: string[] = [];

    for (const packageId of packageIds) {
      try {
        const { error } = await supabase.rpc('admin_confirm_office_delivery', {
          _package_id: packageId,
          _admin_id: user.id,
        });

        if (error) {
          failed.push(packageId);
        } else {
          confirmed.push(packageId);
        }
      } catch {
        failed.push(packageId);
      }
    }

    if (confirmed.length > 0) {
      // Add to label cart before removing from view
      await onAddManyToLabelCart(confirmed);
      onRemovePackages(confirmed);
      toast.success(`${confirmed.length} paquete${confirmed.length !== 1 ? 's' : ''} confirmado${confirmed.length !== 1 ? 's' : ''}`);
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} paquete${failed.length !== 1 ? 's' : ''} no se pudo${failed.length !== 1 ? 'ieron' : ''} confirmar`);
    }

    setConfirmingIds(prev => {
      const next = new Set(prev);
      packageIds.forEach(id => next.delete(id));
      return next;
    });
  };

  const handleMarkIncident = async (packageId: string, currentFlag: boolean) => {
    if (!user) return;

    const newFlag = !currentFlag;

    setMarkingIncidentIds(prev => new Set(prev).add(packageId));
    try {
      if (newFlag) {
        // Marking as incident: set flag + status + add history entry
        const newEntry = {
          action: 'marked',
          timestamp: new Date().toISOString(),
          admin_id: user.id,
          admin_name: 'Operaciones',
          reason: 'Marcado desde panel de recepción',
        };

        // Fetch current history
        const { data: currentPkg } = await supabase
          .from('packages')
          .select('incident_history')
          .eq('id', packageId)
          .single();

        const currentHistory: any[] = (currentPkg?.incident_history as any[]) || [];

        const { error } = await supabase
          .from('packages')
          .update({ 
            incident_flag: true, 
            incident_status: 'active',
            incident_history: [...currentHistory, newEntry],
          })
          .eq('id', packageId);

        if (error) throw error;
        toast.success('Paquete marcado como incidencia');
        onUpdateIncidentFlag(packageId, true);
      } else {
        // Removing incident flag completely (clearing)
        const { error } = await supabase
          .from('packages')
          .update({ incident_flag: false, incident_status: null })
          .eq('id', packageId);

        if (error) throw error;
        toast.success('Incidencia removida');
        onUpdateIncidentFlag(packageId, false);
      }
    } catch (error: any) {
      console.error('Error updating incident flag:', error);
      toast.error(error.message || 'Error al actualizar incidencia');
    } finally {
      setMarkingIncidentIds(prev => {
        const next = new Set(prev);
        next.delete(packageId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tripGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay paquetes pendientes</h3>
          <p className="text-muted-foreground">
            Todos los paquetes han sido procesados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPackages = tripGroups.reduce((sum, t) => sum + t.packages.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {tripGroups.length} viaje{tripGroups.length !== 1 ? 's' : ''} con {totalPackages} paquete{totalPackages !== 1 ? 's' : ''} pendiente{totalPackages !== 1 ? 's' : ''}
        </h2>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="space-y-4">
        {tripGroups.map((trip) => (
          <OperationsTripCard
            key={trip.trip_id}
            trip={trip}
            onConfirmPackage={handleConfirmPackage}
            onConfirmAll={handleConfirmAll}
            onMarkIncident={handleMarkIncident}
            confirmingIds={confirmingIds}
            markingIncidentIds={markingIncidentIds}
          />
        ))}
      </div>
    </div>
  );
};

export default OperationsReceptionTab;

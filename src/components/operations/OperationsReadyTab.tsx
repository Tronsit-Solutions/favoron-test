import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Loader2, Truck, Store, ExternalLink, User, Plane, Tag, Printer, RefreshCw, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateUTC } from '@/lib/formatters';
import { PackageLabelModal } from '@/components/admin/PackageLabelModal';
import { OperationsPackage, ProductData } from '@/hooks/useOperationsData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OperationsReadyTabProps {
  packages: OperationsPackage[];
  loading: boolean;
  onRefresh: () => void;
  onRemovePackage: (id: string) => void;
}

const OperationsReadyTab = ({ packages, loading, onRefresh, onRemovePackage }: OperationsReadyTabProps) => {
  const { user } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [confirmRevertPkg, setConfirmRevertPkg] = useState<OperationsPackage | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedPackagesForLabel, setSelectedPackagesForLabel] = useState<OperationsPackage[]>([]);

  const handleMarkReady = async (pkg: OperationsPackage) => {
    if (!user) return;

    setUpdatingId(pkg.id);
    
    const newStatus = pkg.delivery_method === 'delivery' ? 'ready_for_delivery' : 'ready_for_pickup';
    
    try {
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', pkg.id);

      if (error) throw error;

      const statusLabel = newStatus === 'ready_for_delivery' ? 'listo para entrega' : 'listo para recoger';
      toast.success(`Paquete marcado como ${statusLabel}`);
      onRemovePackage(pkg.id);
    } catch (error: any) {
      console.error('Error updating package:', error);
      toast.error(error.message || 'Error al actualizar paquete');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRevertConfirmation = async (pkg: OperationsPackage) => {
    if (!user) return;
    setRevertingId(pkg.id);

    try {
      // 1. Read office_delivery from DB to get previous_status
      const { data: pkgData, error: fetchError } = await supabase
        .from('packages')
        .select('office_delivery, admin_actions_log, matched_trip_id')
        .eq('id', pkg.id)
        .single();

      if (fetchError) throw fetchError;

      const officeDelivery = pkgData?.office_delivery as any;
      const previousStatus = officeDelivery?.admin_confirmation?.previous_status;

      if (!previousStatus) {
        toast.error('No se encontró el estado anterior para revertir');
        return;
      }

      // 2. Build updated admin_actions_log
      const existingLog = Array.isArray(pkgData?.admin_actions_log) ? pkgData.admin_actions_log : [];
      const revertLogEntry = {
        action: 'revert_office_confirmation',
        by: user.id,
        at: new Date().toISOString(),
        from_status: 'delivered_to_office',
        to_status: previousStatus,
      };

      // 3. Clear admin_confirmation from office_delivery but keep other fields
      const updatedOfficeDelivery = { ...officeDelivery };
      delete updatedOfficeDelivery.admin_confirmation;

      // 4. Update package status back
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          status: previousStatus,
          office_delivery: Object.keys(updatedOfficeDelivery).length > 0 ? updatedOfficeDelivery : null,
          admin_actions_log: [...existingLog, revertLogEntry],
          updated_at: new Date().toISOString(),
        })
        .eq('id', pkg.id);

      if (updateError) throw updateError;

      // 5. Recalculate trip payment accumulator via edge function
      if (pkgData?.matched_trip_id) {
        supabase.functions.invoke('recalculate-trip-accumulator', {
          body: { tripId: pkgData.matched_trip_id },
        }).catch(err => console.error('Error recalculating accumulator:', err));
      }

      toast.success('Confirmación revertida. El paquete regresó a Recepción.');
      onRemovePackage(pkg.id);
      onRefresh();
    } catch (error: any) {
      console.error('Error reverting package:', error);
      toast.error(error.message || 'Error al revertir la confirmación');
    } finally {
      setRevertingId(null);
      setConfirmRevertPkg(null);
    }
  };

  const openLabelModal = (pkgs: OperationsPackage[]) => {
    setSelectedPackagesForLabel(pkgs);
    setShowLabelModal(true);
  };

  const getDeliveryMethodBadge = (method: string | null) => {
    if (method === 'delivery') {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
          <Truck className="h-3 w-3 mr-1" />
          Delivery
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
        <Store className="h-3 w-3 mr-1" />
        Pickup
      </Badge>
    );
  };

  const getActiveProducts = (products: ProductData[] | null): ProductData[] => {
    if (!products || products.length === 0) return [];
    return products.filter(p => !p.cancelled);
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
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay paquetes para preparar</h3>
          <p className="text-muted-foreground">
            Todos los paquetes han sido marcados como listos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">
          Paquetes para preparar ({packages.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openLabelModal(packages)}
            disabled={packages.length === 0}
          >
            <Printer className="h-4 w-4 mr-1" />
            Generar {packages.length} etiqueta{packages.length !== 1 ? 's' : ''}
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {packages.map((pkg) => {
          const activeProducts = getActiveProducts(pkg.products_data);
          
          return (
            <Card key={pkg.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {pkg.label_number && (
                      <Badge variant="default" className="text-base font-mono px-3 py-1">
                        🏷️ #{pkg.label_number}
                      </Badge>
                    )}
                    {getDeliveryMethodBadge(pkg.delivery_method)}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRevertPkg(pkg)}
                      disabled={revertingId === pkg.id}
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      {revertingId === pkg.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Undo2 className="h-4 w-4 mr-1" />
                      )}
                      Revertir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openLabelModal([pkg])}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Etiqueta
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold text-primary uppercase tracking-wide">
                    {pkg.shopper_name}
                  </span>
                </div>
                
                {activeProducts.length > 0 ? (
                  <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      📦 Productos
                    </p>
                    {activeProducts.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-foreground">
                          • {product.name || product.itemDescription || 'Producto'} 
                          {product.quantity && Number(product.quantity) > 1 && (
                            <span className="text-muted-foreground ml-1 font-medium">x{product.quantity}</span>
                          )}
                        </span>
                        {product.itemLink && (
                          <a
                            href={product.itemLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                          >
                            Ver producto
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      📦 Producto
                    </p>
                    <p className="text-sm text-foreground line-clamp-2">
                      {pkg.item_description}
                    </p>
                  </div>
                )}

                {pkg.matched_trip_id && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-md">
                    <Plane className="h-3.5 w-3.5" />
                    <span>
                      {pkg.trip_from_city} → {pkg.trip_to_city}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{pkg.trip_arrival_date ? formatDateUTC(pkg.trip_arrival_date) : 'Sin fecha'}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>Viajero: {pkg.traveler_name}</span>
                  </div>
                )}

                <Button
                  onClick={() => handleMarkReady(pkg)}
                  disabled={updatingId === pkg.id}
                  className="w-full bg-success hover:bg-success/90 text-success-foreground font-semibold"
                  size="lg"
                >
                  {updatingId === pkg.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  ✓ VERIFICADO Y EMPACADO
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PackageLabelModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        packages={selectedPackagesForLabel as any}
      />

      <AlertDialog open={!!confirmRevertPkg} onOpenChange={(open) => !open && setConfirmRevertPkg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revertir confirmación?</AlertDialogTitle>
            <AlertDialogDescription>
              El paquete de <strong>{confirmRevertPkg?.shopper_name}</strong> regresará a la pestaña de Recepción.
              Esta acción deshace la confirmación de entrega en oficina.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRevertPkg && handleRevertConfirmation(confirmRevertPkg)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, revertir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OperationsReadyTab;

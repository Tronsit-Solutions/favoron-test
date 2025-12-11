import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package, User, Truck, Home, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { OperationsPackage, ProductData } from '@/hooks/useOperationsData';

interface OperationsCompletedTabProps {
  packages: OperationsPackage[];
  loading: boolean;
  onRefresh: () => void;
  onRemovePackage: (id: string) => void;
}

const OperationsCompletedTab = ({ packages, loading, onRefresh, onRemovePackage }: OperationsCompletedTabProps) => {
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleMarkCompleted = async (packageId: string) => {
    setCompletingId(packageId);
    try {
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', packageId);

      if (error) throw error;

      toast.success('Paquete marcado como completado');
      onRemovePackage(packageId);
    } catch (error) {
      console.error('Error marking package as completed:', error);
      toast.error('Error al marcar como completado');
    } finally {
      setCompletingId(null);
    }
  };

  const pickupPackages = packages.filter(p => p.status === 'ready_for_pickup');
  const deliveryPackages = packages.filter(p => p.status === 'ready_for_delivery');

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
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay paquetes pendientes de completar</p>
            <p className="text-sm">Los paquetes listos para pickup o delivery aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const PackageCard = ({ pkg }: { pkg: OperationsPackage }) => {
    const isPickup = pkg.status === 'ready_for_pickup';
    const isCompleting = completingId === pkg.id;

    const getProductsList = (products: ProductData[] | null) => {
      if (!products || products.length === 0) return null;
      return products.filter(p => !p.cancelled);
    };

    const activeProducts = getProductsList(pkg.products_data);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pkg.label_number && (
                <Badge variant="outline" className="font-mono">
                  🏷️ #{pkg.label_number}
                </Badge>
              )}
              <Badge 
                variant={isPickup ? "default" : "secondary"}
                className={isPickup ? "bg-blue-500" : "bg-purple-500 text-white"}
              >
                {isPickup ? (
                  <><Home className="h-3 w-3 mr-1" /> PICKUP</>
                ) : (
                  <><Truck className="h-3 w-3 mr-1" /> DELIVERY</>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <User className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">
              {pkg.shopper_name}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-4 w-4" /> Productos:
            </p>
            {activeProducts && activeProducts.length > 0 ? (
              <ul className="text-sm space-y-1 pl-5">
                {activeProducts.map((product, idx) => (
                  <li key={idx} className="list-disc">
                    {product.quantity && Number(product.quantity) > 1 && (
                      <span className="font-medium">x{product.quantity} </span>
                    )}
                    {product.name || product.itemDescription || 'Producto'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm pl-5">{pkg.item_description}</p>
            )}
          </div>

          <Button
            onClick={() => handleMarkCompleted(pkg.id)}
            disabled={isCompleting}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            MARCAR COMO COMPLETADO
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Paquetes para completar ({packages.length})
        </h2>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {pickupPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-500" />
            Listos para Recoger ({pickupPackages.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pickupPackages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}

      {deliveryPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-purple-500" />
            Listos para Envío ({deliveryPackages.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deliveryPackages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsCompletedTab;

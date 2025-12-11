import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package, User, Truck, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OperationsPackage {
  id: string;
  label_number: number | null;
  item_description: string;
  delivery_method: string | null;
  status: string;
  products_summary: any;
  user_id: string;
}

interface ShopperInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const OperationsCompletedTab = () => {
  const [packages, setPackages] = useState<OperationsPackage[]>([]);
  const [shopperProfiles, setShopperProfiles] = useState<Record<string, ShopperInfo>>({});
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_operations_packages', {
        p_statuses: ['ready_for_pickup', 'ready_for_delivery']
      });

      if (error) throw error;

      setPackages(data || []);

      // Fetch shopper profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((p: OperationsPackage) => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (profiles) {
          const profileMap: Record<string, ShopperInfo> = {};
          profiles.forEach(p => {
            profileMap[p.id] = p;
          });
          setShopperProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Error al cargar paquetes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

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
      setPackages(prev => prev.filter(p => p.id !== packageId));
    } catch (error) {
      console.error('Error marking package as completed:', error);
      toast.error('Error al marcar como completado');
    } finally {
      setCompletingId(null);
    }
  };

  const getShopperName = (userId: string) => {
    const profile = shopperProfiles[userId];
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Usuario';
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
          {/* Shopper Name - Prominent */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <User className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">
              {getShopperName(pkg.user_id)}
            </span>
          </div>

          {/* Products */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-4 w-4" /> Productos:
            </p>
            {pkg.products_summary && Array.isArray(pkg.products_summary) ? (
              <ul className="text-sm space-y-1 pl-5">
                {pkg.products_summary.map((product: any, idx: number) => (
                  <li key={idx} className="list-disc">
                    {product.quantity && product.quantity > 1 && (
                      <span className="font-medium">x{product.quantity} </span>
                    )}
                    {product.description || product.itemDescription || 'Producto'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm pl-5">{pkg.item_description}</p>
            )}
          </div>

          {/* Complete Button */}
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
      {/* Pickup Section */}
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

      {/* Delivery Section */}
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

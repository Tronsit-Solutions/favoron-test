import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Loader2, Truck, Store, ExternalLink, User, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateUTC } from '@/lib/formatters';

interface ProductData {
  name?: string;
  itemDescription?: string;
  quantity?: number;
  itemLink?: string;
  cancelled?: boolean;
}

interface PackageForReady {
  id: string;
  item_description: string;
  status: string;
  delivery_method: string | null;
  created_at: string;
  purchase_origin: string;
  package_destination: string;
  matched_trip_id: string | null;
  user_id: string;
  products_data: ProductData[] | null;
  label_number: number | null;
  shopper_name?: string;
  traveler_name?: string;
}

const OperationsReadyTab = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageForReady[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          item_description,
          status,
          delivery_method,
          created_at,
          purchase_origin,
          package_destination,
          matched_trip_id,
          user_id,
          products_data,
          label_number
        `)
        .eq('status', 'delivered_to_office')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch shopper and traveler names
      const packagesWithNames = await Promise.all(
        (data || []).map(async (pkg) => {
          let shopperName = '';
          let travelerName = '';

          const { data: shopperData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', pkg.user_id)
            .single();

          if (shopperData) {
            shopperName = `${shopperData.first_name || ''} ${shopperData.last_name || ''}`.trim();
          }

          if (pkg.matched_trip_id) {
            const { data: tripData } = await supabase
              .from('trips')
              .select('user_id')
              .eq('id', pkg.matched_trip_id)
              .single();

            if (tripData) {
              const { data: travelerData } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', tripData.user_id)
                .single();

              if (travelerData) {
                travelerName = `${travelerData.first_name || ''} ${travelerData.last_name || ''}`.trim();
              }
            }
          }

          return {
            ...pkg,
            products_data: pkg.products_data as ProductData[] | null,
            shopper_name: shopperName,
            traveler_name: travelerName,
          };
        })
      );

      setPackages(packagesWithNames);
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

  const handleMarkReady = async (pkg: PackageForReady) => {
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
      fetchPackages();
    } catch (error: any) {
      console.error('Error updating package:', error);
      toast.error(error.message || 'Error al actualizar paquete');
    } finally {
      setUpdatingId(null);
    }
  };

  const getDeliveryMethodBadge = (method: string | null) => {
    if (method === 'delivery') {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
          <Truck className="h-3 w-3 mr-1" />
          Delivery
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Paquetes para marcar como listos ({packages.length})
        </h2>
        <Button variant="outline" size="sm" onClick={fetchPackages}>
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg) => {
          const activeProducts = getActiveProducts(pkg.products_data);
          
          return (
            <Card key={pkg.id} className="hover:shadow-md transition-shadow overflow-hidden">
              {/* Header con método y ruta */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
                <div className="flex items-center gap-2">
                  {getDeliveryMethodBadge(pkg.delivery_method)}
                  {pkg.label_number && (
                    <Badge variant="outline" className="font-mono">
                      🏷️ #{pkg.label_number}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDateUTC(pkg.created_at)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {pkg.purchase_origin} → {pkg.package_destination}
                </span>
              </div>

              {/* Sección prominente de nombres */}
              <div className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-950/20 dark:to-blue-950/20 px-4 py-3 border-b">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-full">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Shopper</span>
                      <p className="text-lg font-bold text-primary leading-tight">
                        {pkg.shopper_name || 'Desconocido'}
                      </p>
                    </div>
                  </div>
                  {pkg.traveler_name && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/10 rounded-full">
                        <Plane className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Viajero</span>
                        <p className="text-lg font-bold text-blue-600 leading-tight">
                          {pkg.traveler_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                {/* Lista de productos */}
                {activeProducts.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      Productos ({activeProducts.length}):
                    </p>
                    <div className="space-y-1.5 pl-2 border-l-2 border-muted">
                      {activeProducts.map((product, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-foreground">
                            • {product.name || product.itemDescription || 'Producto'} 
                            {product.quantity && product.quantity > 1 && (
                              <span className="text-muted-foreground ml-1">x{product.quantity}</span>
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
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {pkg.item_description}
                  </p>
                )}

                {/* Botón de acción */}
                <Button
                  onClick={() => handleMarkReady(pkg)}
                  disabled={updatingId === pkg.id}
                  className="w-full bg-success hover:bg-success/90 text-success-foreground"
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
    </div>
  );
};

export default OperationsReadyTab;

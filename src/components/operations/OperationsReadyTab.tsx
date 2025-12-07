import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Loader2, Truck, Store, ExternalLink, User, Plane, Tag, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateUTC } from '@/lib/formatters';
import { PackageLabelModal } from '@/components/admin/PackageLabelModal';

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
  trip_from_city?: string;
  trip_to_city?: string;
  trip_arrival_date?: string;
}

interface TripData {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
  user_id: string;
}

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const OperationsReadyTab = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageForReady[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Label modal state
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedPackagesForLabel, setSelectedPackagesForLabel] = useState<PackageForReady[]>([]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // Fetch packages in one query
      const { data: packagesData, error: packagesError } = await supabase
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

      if (packagesError) throw packagesError;

      if (!packagesData || packagesData.length === 0) {
        setPackages([]);
        setLoading(false);
        return;
      }

      // Get unique trip IDs and user IDs
      const tripIds = [...new Set(packagesData.map(p => p.matched_trip_id).filter(Boolean))] as string[];
      const shopperIds = [...new Set(packagesData.map(p => p.user_id))];

      // Batch fetch trips
      let tripsMap = new Map<string, TripData>();
      if (tripIds.length > 0) {
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('id, from_city, to_city, arrival_date, user_id')
          .in('id', tripIds);

        if (tripsError) throw tripsError;
        tripsData?.forEach(t => tripsMap.set(t.id, t));
      }

      // Get traveler IDs from trips
      const travelerIds = [...new Set(Array.from(tripsMap.values()).map(t => t.user_id))];
      const allUserIds = [...new Set([...shopperIds, ...travelerIds])];

      // Batch fetch all profiles in one query
      let profilesMap = new Map<string, ProfileData>();
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', allUserIds);

        if (profilesError) throw profilesError;
        profilesData?.forEach(p => profilesMap.set(p.id, p));
      }

      // Combine data in memory (no additional queries!)
      const packagesWithNames: PackageForReady[] = packagesData.map(pkg => {
        const shopperProfile = profilesMap.get(pkg.user_id);
        const shopperName = shopperProfile 
          ? `${shopperProfile.first_name || ''} ${shopperProfile.last_name || ''}`.trim()
          : '';

        let travelerName = '';
        let tripFromCity = '';
        let tripToCity = '';
        let tripArrivalDate = '';

        if (pkg.matched_trip_id) {
          const trip = tripsMap.get(pkg.matched_trip_id);
          if (trip) {
            tripFromCity = trip.from_city;
            tripToCity = trip.to_city;
            tripArrivalDate = trip.arrival_date;
            
            const travelerProfile = profilesMap.get(trip.user_id);
            if (travelerProfile) {
              travelerName = `${travelerProfile.first_name || ''} ${travelerProfile.last_name || ''}`.trim();
            }
          }
        }

        return {
          ...pkg,
          products_data: pkg.products_data as ProductData[] | null,
          shopper_name: shopperName,
          traveler_name: travelerName,
          trip_from_city: tripFromCity,
          trip_to_city: tripToCity,
          trip_arrival_date: tripArrivalDate,
        };
      });

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

  const openLabelModal = (pkgs: PackageForReady[]) => {
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
      {/* Header with global actions */}
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
          <Button variant="ghost" size="sm" onClick={fetchPackages}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Flat list of packages - package is the main element */}
      <div className="space-y-3">
        {packages.map((pkg) => {
          const activeProducts = getActiveProducts(pkg.products_data);
          
          return (
            <Card key={pkg.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Package Header - Label number prominent */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {pkg.label_number && (
                      <Badge variant="default" className="text-base font-mono px-3 py-1">
                        🏷️ #{pkg.label_number}
                      </Badge>
                    )}
                    {getDeliveryMethodBadge(pkg.delivery_method)}
                  </div>
                  
                  {/* Individual label button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openLabelModal([pkg])}
                    className="shrink-0"
                  >
                    <Tag className="h-4 w-4 mr-1" />
                    Etiqueta
                  </Button>
                </div>
                
                {/* SHOPPER - Primary info, prominent */}
                <div className="flex items-center gap-2 mb-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold text-primary uppercase tracking-wide">
                    {pkg.shopper_name || 'Shopper desconocido'}
                  </span>
                </div>
                
                {/* Products list */}
                {activeProducts.length > 0 ? (
                  <div className="space-y-2 mb-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      📦 Productos
                    </p>
                    {activeProducts.map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-foreground">
                          • {product.name || product.itemDescription || 'Producto'} 
                          {product.quantity && product.quantity > 1 && (
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

                {/* Trip info - Secondary, compact line */}
                {pkg.matched_trip_id && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-md">
                    <Plane className="h-3.5 w-3.5" />
                    <span>
                      {pkg.trip_from_city} → {pkg.trip_to_city}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{pkg.trip_arrival_date ? formatDateUTC(pkg.trip_arrival_date) : 'Sin fecha'}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>Viajero: {pkg.traveler_name || 'Desconocido'}</span>
                  </div>
                )}

                {/* Action button - Full width, prominent */}
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

      {/* Label Modal */}
      <PackageLabelModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        packages={selectedPackagesForLabel as any}
      />
    </div>
  );
};

export default OperationsReadyTab;

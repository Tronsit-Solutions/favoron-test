import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Package, CheckCircle, Loader2, Truck, Store, ExternalLink, User, Plane, Tag, Printer, ChevronDown, ChevronRight } from 'lucide-react';
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
  // Trip info
  trip_from_city?: string;
  trip_to_city?: string;
  trip_arrival_date?: string;
}

interface TripGroup {
  tripId: string | null;
  tripInfo: {
    from_city: string;
    to_city: string;
    arrival_date: string;
    traveler_name: string;
  } | null;
  packages: PackageForReady[];
}

const OperationsReadyTab = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageForReady[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedTrips, setExpandedTrips] = useState<Set<string>>(new Set(['no-trip']));
  
  // Label modal state
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedPackagesForLabel, setSelectedPackagesForLabel] = useState<PackageForReady[]>([]);

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

      // Fetch shopper, traveler names and trip info
      const packagesWithNames = await Promise.all(
        (data || []).map(async (pkg) => {
          let shopperName = '';
          let travelerName = '';
          let tripFromCity = '';
          let tripToCity = '';
          let tripArrivalDate = '';

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
              .select('user_id, from_city, to_city, arrival_date')
              .eq('id', pkg.matched_trip_id)
              .single();

            if (tripData) {
              tripFromCity = tripData.from_city;
              tripToCity = tripData.to_city;
              tripArrivalDate = tripData.arrival_date;

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
            trip_from_city: tripFromCity,
            trip_to_city: tripToCity,
            trip_arrival_date: tripArrivalDate,
          };
        })
      );

      setPackages(packagesWithNames);
      
      // Auto-expand all trip groups
      const tripIds = new Set(packagesWithNames.map(p => p.matched_trip_id || 'no-trip'));
      setExpandedTrips(tripIds);
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

  // Group packages by trip
  const tripGroups = useMemo((): TripGroup[] => {
    const groups: Record<string, TripGroup> = {};
    
    packages.forEach(pkg => {
      const tripKey = pkg.matched_trip_id || 'no-trip';
      
      if (!groups[tripKey]) {
        groups[tripKey] = {
          tripId: pkg.matched_trip_id,
          tripInfo: pkg.matched_trip_id ? {
            from_city: pkg.trip_from_city || '',
            to_city: pkg.trip_to_city || '',
            arrival_date: pkg.trip_arrival_date || '',
            traveler_name: pkg.traveler_name || '',
          } : null,
          packages: [],
        };
      }
      
      groups[tripKey].packages.push(pkg);
    });
    
    // Sort: trips with arrival date first (sorted by date), then no-trip at end
    return Object.values(groups).sort((a, b) => {
      if (!a.tripInfo && b.tripInfo) return 1;
      if (a.tripInfo && !b.tripInfo) return -1;
      if (a.tripInfo && b.tripInfo) {
        return new Date(a.tripInfo.arrival_date).getTime() - new Date(b.tripInfo.arrival_date).getTime();
      }
      return 0;
    });
  }, [packages]);

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

  const toggleTripExpanded = (tripKey: string) => {
    setExpandedTrips(prev => {
      const next = new Set(prev);
      if (next.has(tripKey)) {
        next.delete(tripKey);
      } else {
        next.add(tripKey);
      }
      return next;
    });
  };

  const openLabelModal = (pkgs: PackageForReady[]) => {
    setSelectedPackagesForLabel(pkgs);
    setShowLabelModal(true);
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

      <div className="space-y-6">
        {tripGroups.map((group) => {
          const tripKey = group.tripId || 'no-trip';
          const isExpanded = expandedTrips.has(tripKey);
          
          return (
            <Card key={tripKey} className="overflow-hidden">
              {/* Trip Header */}
              <Collapsible open={isExpanded} onOpenChange={() => toggleTripExpanded(tripKey)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      
                      {group.tripInfo ? (
                        <div className="flex items-center gap-3">
                          <Plane className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-foreground">
                              {group.tripInfo.from_city} → {group.tripInfo.to_city}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              📅 {formatDateUTC(group.tripInfo.arrival_date)} • 👤 {group.tripInfo.traveler_name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-muted-foreground" />
                          <p className="font-semibold text-muted-foreground">Sin viaje asignado</p>
                        </div>
                      )}
                      
                      <Badge variant="secondary" className="ml-2">
                        {group.packages.length} paquete{group.packages.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {/* Button to generate all labels for this trip */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLabelModal(group.packages);
                      }}
                      className="shrink-0"
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Generar {group.packages.length} etiqueta{group.packages.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="divide-y">
                    {group.packages.map((pkg) => {
                      const activeProducts = getActiveProducts(pkg.products_data);
                      
                      return (
                        <div key={pkg.id} className="p-4 hover:bg-muted/30 transition-colors">
                          {/* Package Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getDeliveryMethodBadge(pkg.delivery_method)}
                              {pkg.label_number && (
                                <Badge variant="outline" className="font-mono">
                                  🏷️ #{pkg.label_number}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {pkg.purchase_origin} → {pkg.package_destination}
                              </span>
                            </div>
                            
                            {/* Individual label button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLabelModal([pkg])}
                              className="shrink-0"
                            >
                              <Tag className="h-4 w-4 mr-1" />
                              Etiqueta
                            </Button>
                          </div>
                          
                          {/* Shopper info */}
                          <div className="flex items-center gap-2 mb-3 p-2 bg-primary/5 rounded-lg">
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              Shopper: {pkg.shopper_name || 'Desconocido'}
                            </span>
                          </div>
                          
                          {/* Products list */}
                          {activeProducts.length > 0 ? (
                            <div className="space-y-1.5 mb-4 pl-2 border-l-2 border-muted">
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
                          ) : (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {pkg.item_description}
                            </p>
                          )}

                          {/* Action button */}
                          <Button
                            onClick={() => handleMarkReady(pkg)}
                            disabled={updatingId === pkg.id}
                            className="w-full bg-success hover:bg-success/90 text-success-foreground"
                          >
                            {updatingId === pkg.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            ✓ VERIFICADO Y EMPACADO
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
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

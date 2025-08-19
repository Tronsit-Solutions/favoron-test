import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, MapPin, Package, DollarSign, CheckCircle, ShoppingBag, ChevronDown, User } from "lucide-react";
import { useState } from "react";

interface PackageHistoryProps {
  packages: any[];
  trips: any[];
}

const PackageHistory = ({ packages, trips }: PackageHistoryProps) => {
  // Filtrar paquetes completados (entregados en oficina, viajes completados, cancelados o archivados por el shopper)
  const completedPackages = packages.filter(pkg => {
    // Paquetes cancelados
    if (pkg.status === 'cancelled') return true;

    // Paquetes archivados por el shopper
    if (pkg.status === 'archived_by_shopper') return true;
    
    // Paquetes entregados en oficina
    if (pkg.status === 'delivered_to_office') return true;
    
    // Paquetes que pertenecen a viajes completados y pagados
    if (pkg.matched_trip_id) {
      const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
      return matchedTrip && matchedTrip.status === 'completed_paid';
    }
    
    return false;
  });

  const getMatchedTrip = (packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (pkg?.matched_trip_id) {
      return trips.find(trip => trip.id === pkg.matched_trip_id);
    }
    return null;
  };

  const getDeliveryDate = (pkg: any) => {
    return pkg.office_delivery?.admin_confirmation?.confirmed_at || pkg.updated_at;
  };

  const getStatusDisplay = (pkg: any) => {
    if (pkg.status === 'cancelled') return 'Cancelado';
    if (pkg.status === 'archived_by_shopper') return 'Archivado por el shopper';
    if (pkg.status === 'delivered_to_office') return 'Entregado en oficina';
    const matchedTrip = getMatchedTrip(pkg.id);
    if (matchedTrip?.status === 'completed_paid') return 'Completado y pagado';
    return 'Completado';
  };

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (completedPackages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <span>Historial de Pedidos</span>
          </CardTitle>
          <CardDescription>Tus pedidos completados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes pedidos completados aún</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingBag className="h-5 w-5" />
          <span>Historial de Pedidos</span>
        </CardTitle>
        <CardDescription>Tus pedidos completados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {completedPackages.map((pkg) => {
            const matchedTrip = getMatchedTrip(pkg.id);
            const deliveryDate = getDeliveryDate(pkg);

            return (
              <Collapsible key={pkg.id} open={!!expandedIds[pkg.id]} onOpenChange={() => toggleExpanded(pkg.id)}>
                <Card className="transition-shadow">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{pkg.item_description}</span>
                        </div>
                        <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{pkg.package_destination}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{new Date(deliveryDate).toLocaleDateString('es-GT')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                        <Badge 
                          variant={pkg.status === 'cancelled' ? 'destructive' : 'default'} 
                          className={pkg.status === 'cancelled' ? 'text-center' : 'bg-green-600 text-center'}
                        >
                          {getStatusDisplay(pkg)}
                        </Badge>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center justify-center space-x-1 w-full sm:w-auto"
                          >
                            <span>Detalles</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>

                    <CollapsibleContent className="mt-3 md:mt-4">
                      <div className="space-y-4 md:space-y-6 pt-3 md:pt-4 border-t">
                        {/* Resumen del pedido */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                          <Card>
                            <CardContent className="p-2 md:p-3 text-center">
                              <DollarSign className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-sm font-semibold">${pkg.estimated_price || '0'}</div>
                              <div className="text-xs text-muted-foreground">Precio del producto</div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-2 md:p-3 text-center">
                              <DollarSign className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-sm font-semibold">Q{pkg.quote?.totalPrice || '0'}</div>
                              <div className="text-xs text-muted-foreground">Precio Favorón</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-2 md:p-3 text-center">
                              <Calendar className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 text-muted-foreground" />
                              <div className="text-sm font-semibold">
                                {new Date(getDeliveryDate(pkg)).toLocaleDateString('es-GT')}
                              </div>
                              <div className="text-xs text-muted-foreground">Fecha de entrega en oficina</div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-2 md:p-3 text-center">
                              <CheckCircle className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 text-green-600" />
                              <div className="text-sm font-semibold">{getStatusDisplay(pkg)}</div>
                              <div className="text-xs text-muted-foreground">Estado</div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Detalles del producto */}
                        <div>
                          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Detalles del Producto</h3>
                          <Card>
                            <CardContent className="p-3 md:p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium">Descripción:</p>
                                  <p className="text-sm text-muted-foreground break-words">{pkg.item_description}</p>
                                </div>
                                
                                {pkg.purchase_origin && (
                                  <div>
                                    <p className="text-sm font-medium">Origen de compra:</p>
                                    <p className="text-sm text-muted-foreground">{pkg.purchase_origin}</p>
                                  </div>
                                )}

                                {pkg.item_link && (
                                  <div>
                                    <p className="text-sm font-medium">Link del producto:</p>
                                    <a 
                                      href={pkg.item_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline break-all"
                                    >
                                      Ver producto original
                                    </a>
                                  </div>
                                )}

                                {pkg.additional_notes && (
                                  <div>
                                    <p className="text-sm font-medium">Notas adicionales:</p>
                                    <p className="text-sm text-muted-foreground break-words">{pkg.additional_notes}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Información del viajero */}
                        {matchedTrip && (
                          <div>
                            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Información del Viaje</h3>
                            <Card>
                              <CardContent className="p-3 md:p-4">
                                <div className="space-y-3">
                                  <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm break-words">
                                      <strong>Ruta:</strong> {matchedTrip.from_city} → {matchedTrip.to_city}
                                    </span>
                                  </div>
                                  <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm">
                                      <strong>Llegada:</strong> {new Date(matchedTrip.arrival_date).toLocaleDateString('es-GT')}
                                    </span>
                                  </div>
                                  {matchedTrip.profiles && (
                                    <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm">
                                        <strong>Viajero:</strong> {matchedTrip.profiles.first_name} {matchedTrip.profiles.last_name}
                                        {matchedTrip.profiles.username && (
                                          <span className="text-muted-foreground ml-1">(@{matchedTrip.profiles.username})</span>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageHistory;

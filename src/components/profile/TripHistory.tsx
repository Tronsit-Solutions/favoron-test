import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Package, DollarSign, CheckCircle } from "lucide-react";
import { useState } from "react";

interface TripHistoryProps {
  trips: any[];
  packages: any[];
}

const TripHistory = ({ trips, packages }: TripHistoryProps) => {
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Filtrar solo viajes completados y pagados
  const completedTrips = trips.filter(trip => trip.status === 'completed_paid');

  const getTripPackages = (tripId: string) => {
    return packages.filter(pkg => 
      pkg.matched_trip_id === tripId && 
      ['completed', 'completed_paid', 'delivered_to_office'].includes(pkg.status)
    );
  };

  const getTotalTips = (tripId: string) => {
    const tripPackages = getTripPackages(tripId);
    return tripPackages.reduce((total, pkg) => {
      const tip = pkg.quote?.price ? parseFloat(pkg.quote.price) : 0;
      return total + tip;
    }, 0);
  };

  const getDeliveryDate = (tripId: string) => {
    const tripPackages = getTripPackages(tripId);
    const deliveredPackage = tripPackages.find(pkg => 
      pkg.status === 'delivered_to_office' && pkg.office_delivery?.admin_confirmation?.confirmed_at
    );
    return deliveredPackage?.office_delivery?.admin_confirmation?.confirmed_at;
  };

  if (completedTrips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Historial de Viajes</span>
          </CardTitle>
          <CardDescription>Tus viajes completados y pagados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes viajes completados aún</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedTrip ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Historial de Viajes</span>
            </CardTitle>
            <CardDescription>Tus viajes completados y pagados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTrips.map((trip) => {
                const tripPackages = getTripPackages(trip.id);
                const totalTips = getTotalTips(trip.id);
                const deliveryDate = getDeliveryDate(trip.id);

                return (
                  <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{trip.from_city} → {trip.to_city}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(trip.created_at).toLocaleDateString('es-GT')}</span>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Finalizado y Pagado
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg font-semibold">{tripPackages.length}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Paquetes</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-lg font-semibold">Q{totalTips.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Tips recibidos</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-lg font-semibold">✓</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Completado</p>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedTrip(trip)}
                      >
                        Ver Detalles
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>{selectedTrip.from_city} → {selectedTrip.to_city}</span>
                </CardTitle>
                <CardDescription>
                  Llegada: {(() => {
                    const date = new Date(selectedTrip.arrival_date);
                    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT');
                  })()} • Fecha de entrega en oficina: {(() => {
                    const date = new Date(selectedTrip.delivery_date);
                    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT');
                  })()}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedTrip(null)}>
                Volver al Historial
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumen del viaje */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-semibold">{getTripPackages(selectedTrip.id).length}</div>
                  <div className="text-xs text-muted-foreground">Paquetes transportados</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-semibold">Q{getTotalTips(selectedTrip.id).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Total tips</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-semibold">
                    {getDeliveryDate(selectedTrip.id) ? 
                      new Date(getDeliveryDate(selectedTrip.id)).toLocaleDateString('es-GT') : 
                      'N/A'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Fecha entrega oficina</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <div className="text-lg font-semibold">Completado</div>
                  <div className="text-xs text-muted-foreground">Estado final</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de paquetes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Paquetes Transportados</h3>
              <div className="space-y-3">
                {getTripPackages(selectedTrip.id).map((pkg) => (
                  <Card key={pkg.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{pkg.item_description}</p>
                          <p className="text-sm text-muted-foreground">
                            Para: {pkg.package_destination}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="default" className="bg-green-600">
                              {pkg.status === 'delivered_to_office' ? 'Entregado en oficina' : pkg.status}
                            </Badge>
                            {pkg.quote?.price && (
                              <span className="text-sm text-muted-foreground">
                                Tip: Q{pkg.quote.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TripHistory;
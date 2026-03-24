import { useState, useMemo } from "react";
import { Trip, Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Plane, Edit, Eye, MapPin, Calendar, Package as PackageIcon, User } from "lucide-react";
import { formatCurrency, formatDollarPrice } from "@/lib/formatters";
import TripPackagesModal from "./TripPackagesModal";

interface UserTripsTabProps {
  trips: Trip[];
  allPackages: Package[];
  loadingTrips?: boolean;
}

const UserTripsTab = ({ trips, allPackages, loadingTrips }: UserTripsTabProps) => {
  const { getStatusBadge } = useStatusHelpers();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  
  console.log('🚗 UserTripsTab - Received trips:', {
    count: trips.length,
    trips: trips.map(t => ({ 
      id: t.id.slice(0, 8), 
      status: t.status, 
      from: t.from_city,
      to: t.to_city,
      user_id: t.user_id.slice(0, 8)
    }))
  });

  const getAssignedPackages = (tripId: string) => {
    return allPackages.filter(pkg => pkg.matched_trip_id === tripId);
  };

  // Create a mapping of user_id to user name from allPackages that might have profile data
  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    allPackages.forEach(pkg => {
      if (pkg.user_id && !map[pkg.user_id]) {
        // Try to get name from package profiles data (if joined)
        const profiles = (pkg as any).profiles;
        if (profiles) {
          const name = `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim();
          if (name) {
            map[pkg.user_id] = name;
          } else {
            map[pkg.user_id] = profiles.email?.split('@')[0] || `Usuario #${pkg.user_id.slice(0, 8)}`;
          }
        } else {
          map[pkg.user_id] = `Usuario #${pkg.user_id.slice(0, 8)}`;
        }
      }
    });
    return map;
  }, [allPackages]);

  const getUserDisplayName = (userId: string) => {
    return userNameMap[userId] || `Usuario #${userId.slice(0, 8)}`;
  };

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  const handleEditTrip = (trip: Trip) => {
    // Edit functionality would be implemented here  
  };

  const handleViewPackages = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowPackagesModal(true);
  };

  if (loadingTrips) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Plane className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p>Cargando viajes...</p>
        </CardContent>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay viajes registrados como viajero</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Viajes como Viajero ({trips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Paquetes Asignados</TableHead>
                <TableHead>Tip Confirmado</TableHead>
                <TableHead>Dirección de Recepción</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => {
                const assignedPackages = getAssignedPackages(trip.id);
                const confirmedTip = assignedPackages
                  .filter(pkg => pkg.status && ['pending_purchase', 'in_transit', 'received_by_traveler', 'delivered_to_office', 'completed'].includes(pkg.status))
                  .reduce((total, pkg) => {
                    const quote = pkg.quote as any;
                    const quotePrice = quote?.price || quote?.totalPrice || 0;
                    const tip = typeof quotePrice === 'string' ? parseFloat(quotePrice) : Number(quotePrice);
                    return total + (Number.isFinite(tip) ? tip : 0);
                  }, 0);

                return (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-mono">
                        #{trip.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">
                          {trip.from_city} → {trip.to_city}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(trip.status, { context: 'trip' })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Llegada: {new Date(trip.arrival_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Entrega en oficina: {new Date(trip.delivery_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <PackageIcon className="h-3 w-3" />
                          {assignedPackages.length}
                        </Badge>
                        {assignedPackages.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPackages(trip)}
                          >
                            Ver paquetes
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {confirmedTip > 0 ? formatCurrency(confirmedTip) : formatCurrency(0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{(trip.package_receiving_address as any)?.streetAddress || 'No definido'}</p>
                        <p className="text-muted-foreground">{(trip.package_receiving_address as any)?.cityArea || ''}</p>
                        {(trip.package_receiving_address as any)?.hotelAirbnbName && (
                          <p className="text-muted-foreground">{(trip.package_receiving_address as any).hotelAirbnbName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(trip)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTrip(trip)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assigned Packages Details */}
      {trips.some(trip => getAssignedPackages(trip.id).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageIcon className="h-5 w-5" />
              Paquetes Asignados a Viajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trips.map((trip) => {
                const assignedPackages = getAssignedPackages(trip.id);
                if (assignedPackages.length === 0) return null;

                return (
                  <div key={trip.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">
                          Viaje: {trip.from_city} → {trip.to_city}
                        </h4>
                        <span className="text-xs text-muted-foreground/50 font-mono">
                          #{trip.id.slice(0, 8)}
                        </span>
                      </div>
                      <Badge variant="outline">{assignedPackages.length} paquetes</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {assignedPackages.map((pkg) => {
                        const quote = pkg.quote as any;
                        const quotePrice = quote?.price || quote?.totalPrice || 0;
                        const tip = typeof quotePrice === 'string' ? parseFloat(quotePrice) : Number(quotePrice);
                        const isConfirmed = pkg.status && ['pending_purchase', 'in_transit', 'received_by_traveler', 'delivered_to_office', 'completed'].includes(pkg.status);
                        
                        return (
                          <div key={pkg.id} className="flex items-center justify-between p-2 bg-muted rounded border">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {pkg.item_description || 'Sin descripción'}
                                </span>
                                {getStatusBadge(pkg.status)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Comprador: {getUserDisplayName(pkg.user_id)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                Precio (USD): {formatDollarPrice(pkg.estimated_price || 0)}
                              </p>
                              {isConfirmed && tip > 0 && (
                                <p className="text-xs text-green-600 font-medium">
                                  Tip (GTQ): {formatCurrency(tip)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Packages Modal */}
      <TripPackagesModal
        trip={selectedTrip}
        isOpen={showPackagesModal}
        onClose={() => {
          setShowPackagesModal(false);
          setSelectedTrip(null);
        }}
      />
    </div>
  );
};

export default UserTripsTab;
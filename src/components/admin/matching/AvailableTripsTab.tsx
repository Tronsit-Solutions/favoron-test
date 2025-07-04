import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Eye, CalendarDays, Plane, Package } from "lucide-react";

interface AvailableTripsTabProps {
  trips: any[];
  onViewTripDetail: (trip: any) => void;
}

const getSpaceBadgeColor = (space: number) => {
  if (space >= 10) return 'bg-green-100 text-green-800';
  if (space >= 5) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const AvailableTripsTab = ({ trips, onViewTripDetail }: AvailableTripsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [originFilter, setOriginFilter] = useState("all");
  const [spaceFilter, setSpaceFilter] = useState("all");

  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  
  // Get unique origins for filter
  const origins = [...new Set(availableTrips.map(trip => trip.fromCountry || 'País no especificado'))];

  // Filter trips based on search and filters
  const filteredTrips = availableTrips.filter(trip => {
    const matchesSearch = 
      (trip.fromCity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.toCity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.fromCountry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.userId || '').toString().includes(searchTerm);
    
    const matchesOrigin = originFilter === "all" || trip.fromCountry === originFilter;
    
    const matchesSpace = spaceFilter === "all" || 
      (spaceFilter === "high" && trip.availableSpace >= 10) ||
      (spaceFilter === "medium" && trip.availableSpace >= 5 && trip.availableSpace < 10) ||
      (spaceFilter === "low" && trip.availableSpace < 5);
    
    return matchesSearch && matchesOrigin && matchesSpace;
  });

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">✈️ Viajes disponibles</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTrips.length} viajes aprobados con espacio disponible
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            {filteredTrips.filter(t => t.availableSpace >= 10).length} Con mucho espacio
          </Badge>
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
            {filteredTrips.filter(t => t.availableSpace >= 5 && t.availableSpace < 10).length} Espacio medio
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ciudad, país o viajero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            {origins.map(origin => (
              <SelectItem key={origin} value={origin}>{origin}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={spaceFilter} onValueChange={setSpaceFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por espacio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el espacio</SelectItem>
            <SelectItem value="high">Alto (10+ kg)</SelectItem>
            <SelectItem value="medium">Medio (5-9 kg)</SelectItem>
            <SelectItem value="low">Bajo (&lt; 5 kg)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trips List */}
      <div className="space-y-3">
        {filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">✈️</div>
                <p className="text-muted-foreground">
                  {searchTerm || originFilter !== "all" || spaceFilter !== "all" 
                    ? "No se encontraron viajes con los filtros aplicados"
                    : "No hay viajes disponibles"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTrips.map(trip => (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    {/* Main route info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Plane className="h-4 w-4 text-blue-500" />
                          <h4 className="font-medium text-sm">
                            {trip.fromCountry || 'País'} ({trip.fromCity}) → {trip.toCountry || 'Guatemala'} ({trip.toCity})
                          </h4>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            👤 Viajero: {trip.userId}
                          </span>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getSpaceBadgeColor(trip.availableSpace)}`}>
                        <Package className="h-3 w-3 mr-1" />
                        {trip.availableSpace}kg
                      </Badge>
                    </div>

                    {/* Dates info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <CalendarDays className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-600">
                          Llegada: {new Date(trip.arrivalDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {trip.firstDayPackages && (
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600">
                            📥 Primer día: {new Date(trip.firstDayPackages).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {trip.lastDayPackages && (
                        <div className="flex items-center space-x-1">
                          <span className="text-red-600">
                            📤 Último día: {new Date(trip.lastDayPackages).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Office delivery date */}
                    {trip.officeDeliveryDate && (
                      <div className="flex items-center space-x-1 text-xs">
                        <CalendarDays className="h-3 w-3 text-primary" />
                        <span className="text-primary font-medium">
                          Entrega oficina: {new Date(trip.officeDeliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewTripDetail(trip)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver + Match
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AvailableTripsTab;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Eye, CalendarDays, Plane } from "lucide-react";

interface AvailableTripsTabProps {
  trips: any[];
  onViewTripDetail: (trip: any) => void;
}

const AvailableTripsTab = ({ trips, onViewTripDetail }: AvailableTripsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [originFilter, setOriginFilter] = useState("all");

  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  
  // Get unique origins for filter
  const origins = [...new Set(availableTrips.map(trip => trip.from_city))];

  // Filter trips based on search and filters
  const filteredTrips = availableTrips.filter(trip => {
    const matchesSearch = 
      (trip.from_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.to_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.user_id || '').toString().includes(searchTerm);
    
    const matchesOrigin = originFilter === "all" || trip.from_city === originFilter;
    
    return matchesSearch && matchesOrigin;
  });

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">✈️ Viajes disponibles</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTrips.length} viajes disponibles para matching
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            {filteredTrips.filter(t => t.status === 'approved').length} Aprobados
          </Badge>
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            {filteredTrips.filter(t => t.status === 'active').length} Activos
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ciudad o viajero..."
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
      </div>

      {/* Trips List */}
      <div className="space-y-3">
        {filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">✈️</div>
                <p className="text-muted-foreground">
                  {searchTerm || originFilter !== "all" 
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
                       <div className="flex-1">
                         <div className="flex items-center space-x-2 mb-2">
                           <Plane className="h-4 w-4 text-blue-500" />
                           <h4 className="font-medium text-sm">
                             {trip.from_city} → {trip.to_city}
                           </h4>
                         </div>
                         <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                           <span>👤 Viajero: {trip.user_id}</span>
                           <span>📋 Estado: {trip.status}</span>
                         </div>
                       </div>
                     </div>

                     {/* Dates info */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                       <div className="flex items-center space-x-1">
                         <CalendarDays className="h-3 w-3 text-orange-500" />
                         <span className="text-orange-600">
                           Salida: {new Date(trip.departure_date).toLocaleDateString()}
                         </span>
                       </div>
                       
                       <div className="flex items-center space-x-1">
                         <CalendarDays className="h-3 w-3 text-blue-500" />
                         <span className="text-blue-600">
                           Llegada: {new Date(trip.arrival_date).toLocaleDateString()}
                         </span>
                       </div>
                       
                       <div className="flex items-center space-x-1">
                         <span className="text-green-600">
                           📥 Primer día paquetes: {new Date(trip.first_day_packages).toLocaleDateString()}
                         </span>
                       </div>
                       
                       <div className="flex items-center space-x-1">
                         <span className="text-red-600">
                           📤 Último día paquetes: {new Date(trip.last_day_packages).toLocaleDateString()}
                         </span>
                       </div>
                     </div>

                     {/* Delivery date */}
                     <div className="flex items-center space-x-1 text-xs">
                       <CalendarDays className="h-3 w-3 text-primary" />
                       <span className="text-primary font-medium">
                         Entrega: {new Date(trip.delivery_date).toLocaleDateString()}
                       </span>
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewTripDetail(trip)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
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
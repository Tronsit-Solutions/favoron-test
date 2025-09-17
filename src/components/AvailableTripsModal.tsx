import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plane, Calendar } from "lucide-react";
import { usePublicTrips } from "@/hooks/usePublicTrips";
import { LoadingState } from "@/components/ui/loading-state";

interface AvailableTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AvailableTripsModal = ({ isOpen, onClose }: AvailableTripsModalProps) => {
  const { trips, loading } = usePublicTrips();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTrips = trips.filter(trip => 
    trip.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-br from-teal-500/5 via-cyan-400/5 to-emerald-500/5 p-3 sm:p-6">
        <DialogHeader className="bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500 -mx-3 sm:-mx-6 -mt-3 sm:-mt-6 px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-1 sm:gap-2 text-white text-base sm:text-xl">
            <span className="text-sm sm:text-xl">🌍</span>
            <span className="truncate">Hub de Viajes</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-2 sm:space-y-4 mt-2 sm:mt-4">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-teal-600 h-3 w-3 sm:h-4 sm:w-4" />
            <Input
              placeholder="Buscar por origen o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 pr-2 border-teal-300 focus:border-teal-500 focus:ring-teal-500 h-9 sm:h-11 text-sm sm:text-base"
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filteredTrips.length} viaje{filteredTrips.length !== 1 ? 's' : ''} disponible{filteredTrips.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-2">
          {loading ? (
            <LoadingState message="Cargando viajes disponibles..." />
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Plane className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No hay viajes disponibles</h3>
              <p className="text-sm text-muted-foreground px-4">
                {searchTerm ? "No se encontraron viajes que coincidan con tu búsqueda." : "No hay viajes aprobados en este momento."}
              </p>
            </div>
          ) : (
            filteredTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="border border-teal-200 rounded-lg p-2 sm:p-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                  {/* Route section - always stacked on mobile */}
                  <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm font-medium overflow-hidden">
                    <span className="text-sm sm:text-base flex-shrink-0">🛫</span>
                    <span className="text-foreground font-semibold truncate max-w-[60px] sm:max-w-[120px]" title={trip.from_city}>
                      {trip.from_city}
                    </span>
                    <span className="text-teal-500 font-bold flex-shrink-0">→</span>
                    <span className="text-foreground font-semibold truncate max-w-[60px] sm:max-w-[120px]" title={trip.to_city}>
                      {trip.to_city}
                    </span>
                    <span className="text-sm sm:text-base flex-shrink-0">🛬</span>
                  </div>
                  
                  {/* Date and badge section - separate row on mobile */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 text-teal-600 flex-shrink-0" />
                    <span className="font-medium truncate">{formatDate(trip.arrival_date)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailableTripsModal;
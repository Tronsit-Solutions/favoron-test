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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-gradient-to-br from-teal-500/5 via-cyan-400/5 to-emerald-500/5">
        <DialogHeader className="bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500 -mx-6 -mt-6 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-white">
            <span className="text-lg">🌍</span>
            Hub de Viajes
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-600 h-4 w-4" />
            <Input
              placeholder="Buscar por origen o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-teal-300 focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredTrips.length} viaje{filteredTrips.length !== 1 ? 's' : ''} disponible{filteredTrips.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <LoadingState message="Cargando viajes disponibles..." />
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8">
              <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay viajes disponibles</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron viajes que coincidan con tu búsqueda." : "No hay viajes aprobados en este momento."}
              </p>
            </div>
          ) : (
            filteredTrips.map((trip, index) => (
              <div
                key={trip.id}
                className="border border-teal-200 rounded-lg p-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-300 hover:scale-105 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-lg">🛫</span>
                      <span className="text-foreground font-semibold">{trip.from_city}</span>
                      <span className="text-teal-500 font-bold">→</span>
                      <span className="text-foreground font-semibold">{trip.to_city}</span>
                      <span className="text-lg">🛬</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      <span className="font-medium">{formatDate(trip.arrival_date)}</span>
                    </div>
                    <Badge className="text-xs bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0 hover:from-teal-600 hover:to-cyan-600">
                      ✨ Disponible
                    </Badge>
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
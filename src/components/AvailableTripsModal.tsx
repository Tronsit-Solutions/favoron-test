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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Viajes Disponibles
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por origen o destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
            filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-foreground">{trip.from_city}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-foreground">{trip.to_city}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(trip.arrival_date)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Disponible
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
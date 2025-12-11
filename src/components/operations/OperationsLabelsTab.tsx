import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Loader2, Printer, MapPin, Calendar, RefreshCw } from 'lucide-react';
import { formatDateUTC } from '@/lib/formatters';
import { PackageLabelModal } from '@/components/admin/PackageLabelModal';
import { TripWithPackages } from '@/hooks/useOperationsData';

interface OperationsLabelsTabProps {
  trips: TripWithPackages[];
  loading: boolean;
  onRefresh: () => void;
}

const OperationsLabelsTab = ({ trips, loading, onRefresh }: OperationsLabelsTabProps) => {
  const [selectedTrip, setSelectedTrip] = useState<TripWithPackages | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const handleOpenLabels = (trip: TripWithPackages) => {
    setSelectedTrip(trip);
    setShowLabelModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay viajes con paquetes</h3>
          <p className="text-muted-foreground">
            No hay viajes activos con paquetes asignados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Viajes con paquetes ({trips.length})
        </h2>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {trips.map((trip) => (
          <Card key={trip.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {trip.packages.length} paquete{trip.packages.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {trip.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="h-4 w-4" />
                    {trip.from_city} → {trip.to_city}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ✈️ Viajero: {trip.traveler_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Llegada: {formatDateUTC(trip.arrival_date)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleOpenLabels(trip)}
                  className="shrink-0"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Ver Etiquetas
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showLabelModal && selectedTrip && selectedTrip.packages.length > 0 && (
        <PackageLabelModal
          isOpen={showLabelModal}
          onClose={() => {
            setShowLabelModal(false);
            setSelectedTrip(null);
          }}
          packages={selectedTrip.packages}
        />
      )}
    </div>
  );
};

export default OperationsLabelsTab;

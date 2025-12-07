import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Loader2, Printer, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateUTC } from '@/lib/formatters';
import { PackageLabelModal } from '@/components/admin/PackageLabelModal';

interface PackageForLabel {
  id: string;
  item_description: string;
  status: string;
  label_number: number | null;
  products_data?: any;
  package_destination: string;
  confirmed_delivery_address?: any;
}

interface TripWithPackages {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
  delivery_date: string;
  status: string;
  traveler_name: string;
  packages: PackageForLabel[];
}

const OperationsLabelsTab = () => {
  const [trips, setTrips] = useState<TripWithPackages[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TripWithPackages | null>(null);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      // 1. Fetch trips with active/approved status
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, from_city, to_city, arrival_date, delivery_date, status, user_id')
        .in('status', ['approved', 'active'])
        .order('arrival_date', { ascending: true });

      if (tripsError) throw tripsError;
      if (!tripsData || tripsData.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // 2. Batch fetch all traveler profiles
      const travelerIds = [...new Set(tripsData.map(t => t.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', travelerIds);

      const profilesMap = new Map<string, { first_name: string | null; last_name: string | null }>();
      profilesData?.forEach(p => profilesMap.set(p.id, p));

      // 3. Batch fetch all packages for these trips
      const tripIds = tripsData.map(t => t.id);
      const { data: packagesData } = await supabase
        .from('packages')
        .select('id, item_description, status, label_number, package_destination, confirmed_delivery_address, products_data, matched_trip_id')
        .in('matched_trip_id', tripIds)
        .not('status', 'in', '("cancelled","rejected")');

      // Group packages by trip
      const packagesByTrip = new Map<string, PackageForLabel[]>();
      packagesData?.forEach(pkg => {
        if (!pkg.matched_trip_id) return;
        if (!packagesByTrip.has(pkg.matched_trip_id)) {
          packagesByTrip.set(pkg.matched_trip_id, []);
        }
        packagesByTrip.get(pkg.matched_trip_id)!.push({
          id: pkg.id,
          item_description: pkg.item_description,
          status: pkg.status,
          label_number: pkg.label_number,
          package_destination: pkg.package_destination,
          confirmed_delivery_address: pkg.confirmed_delivery_address,
          products_data: pkg.products_data,
        });
      });

      // 4. Build final result in memory
      const tripsWithDetails: TripWithPackages[] = tripsData
        .map(trip => {
          const traveler = profilesMap.get(trip.user_id);
          const travelerName = traveler
            ? `${traveler.first_name || ''} ${traveler.last_name || ''}`.trim()
            : 'Desconocido';

          return {
            id: trip.id,
            from_city: trip.from_city,
            to_city: trip.to_city,
            arrival_date: trip.arrival_date,
            delivery_date: trip.delivery_date,
            status: trip.status,
            traveler_name: travelerName,
            packages: packagesByTrip.get(trip.id) || [],
          };
        })
        .filter(t => t.packages.length > 0);

      setTrips(tripsWithDetails);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Error al cargar viajes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

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
        <Button variant="outline" size="sm" onClick={fetchTrips}>
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

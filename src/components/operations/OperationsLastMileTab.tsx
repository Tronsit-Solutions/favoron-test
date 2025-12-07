import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Loader2, CheckCircle, MapPin, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateUTC } from '@/lib/formatters';

interface TripForLastMile {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
  delivery_date: string;
  status: string;
  last_mile_delivered: boolean;
  traveler_name: string;
  package_count: number;
  delivered_count: number;
}

const OperationsLastMileTab = () => {
  const [trips, setTrips] = useState<TripForLastMile[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      // Fetch trips that have packages delivered to office
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, from_city, to_city, arrival_date, delivery_date, status, last_mile_delivered, user_id')
        .in('status', ['approved', 'active'])
        .order('arrival_date', { ascending: true });

      if (tripsError) throw tripsError;

      // Fetch details for each trip
      const tripsWithDetails = await Promise.all(
        (tripsData || []).map(async (trip) => {
          // Get traveler name
          const { data: travelerData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', trip.user_id)
            .single();

          const travelerName = travelerData
            ? `${travelerData.first_name || ''} ${travelerData.last_name || ''}`.trim()
            : 'Desconocido';

          // Get package counts
          const { data: packagesData } = await supabase
            .from('packages')
            .select('id, status')
            .eq('matched_trip_id', trip.id)
            .not('status', 'in', '("cancelled","rejected")');

          const packages = packagesData || [];
          const deliveredCount = packages.filter(
            (p) => p.status === 'delivered_to_office' || p.status === 'completed'
          ).length;

          return {
            id: trip.id,
            from_city: trip.from_city,
            to_city: trip.to_city,
            arrival_date: trip.arrival_date,
            delivery_date: trip.delivery_date,
            status: trip.status,
            last_mile_delivered: trip.last_mile_delivered,
            traveler_name: travelerName,
            package_count: packages.length,
            delivered_count: deliveredCount,
          };
        })
      );

      // Filter only trips with delivered packages that haven't been marked as last mile
      setTrips(
        tripsWithDetails.filter(
          (t) => t.delivered_count > 0 && !t.last_mile_delivered
        )
      );
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

  const handleMarkLastMile = async (tripId: string) => {
    setMarkingId(tripId);
    try {
      const { error } = await supabase
        .from('trips')
        .update({ last_mile_delivered: true })
        .eq('id', tripId);

      if (error) throw error;

      toast.success('Última milla marcada como entregada');
      fetchTrips();
    } catch (error: any) {
      console.error('Error marking last mile:', error);
      toast.error(error.message || 'Error al marcar última milla');
    } finally {
      setMarkingId(null);
    }
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
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay entregas pendientes</h3>
          <p className="text-muted-foreground">
            Todos los viajes han sido marcados como entregados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Viajes pendientes de última milla ({trips.length})
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
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {trip.delivered_count}/{trip.package_count} entregados
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Pendiente última milla
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
                    Entrega: {formatDateUTC(trip.delivery_date)}
                  </div>
                </div>
                <Button
                  onClick={() => handleMarkLastMile(trip.id)}
                  disabled={markingId === trip.id}
                  className="shrink-0"
                >
                  {markingId === trip.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Marcar como Entregado
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OperationsLastMileTab;

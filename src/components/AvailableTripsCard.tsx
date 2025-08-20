import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar, ArrowRight } from "lucide-react";
import { usePublicTrips } from "@/hooks/usePublicTrips";

interface AvailableTripsCardProps {
  onViewTrips: () => void;
}

const AvailableTripsCard = ({ onViewTrips }: AvailableTripsCardProps) => {
  const { trips, loading } = usePublicTrips();

  const tripsThisWeek = trips.filter(trip => {
    const arrivalDate = new Date(trip.arrival_date);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return arrivalDate >= today && arrivalDate <= nextWeek;
  });

  const upcomingTrips = trips.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          Viajes Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {loading ? "..." : trips.length}
            </div>
            <div className="text-sm text-muted-foreground">Total disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {loading ? "..." : tripsThisWeek.length}
            </div>
            <div className="text-sm text-muted-foreground">Esta semana</div>
          </div>
        </div>


        <Button 
          onClick={onViewTrips} 
          className="w-full" 
          variant="outline"
          disabled={loading}
        >
          <Plane className="h-4 w-4 mr-2" />
          Ver todos los viajes
        </Button>
      </CardContent>
    </Card>
  );
};

export default AvailableTripsCard;
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

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-400 to-emerald-500 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <span className="text-lg">🌍</span>
          Hub de Viajes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
              <span>✈️</span>
              {loading ? "..." : trips.length}
            </div>
            <div className="text-sm text-white/80">Total disponibles</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
              <span>⚡</span>
              {loading ? "..." : tripsThisWeek.length}
            </div>
            <div className="text-sm text-white/80">Esta semana</div>
          </div>
        </div>

        <Button 
          onClick={onViewTrips} 
          className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105" 
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar, ArrowRight } from "lucide-react";
import { usePublicStats } from "@/hooks/usePublicStats";

interface AvailableTripsCardProps {
  onViewTrips: () => void;
}

const AvailableTripsCard = ({ onViewTrips }: AvailableTripsCardProps) => {
  const { stats, loading } = usePublicStats();

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-teal-300 via-cyan-200 to-emerald-300 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <span className="text-lg">🌍</span>
          Hub de Viajes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center border border-slate-200 hover:bg-white/70 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-1">
              <span>✈️</span>
              {loading ? "..." : stats.total_trips}
            </div>
            <div className="text-sm text-slate-600">Viajes activos</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center border border-slate-200 hover:bg-white/70 transition-all duration-300 hover:scale-105">
            <div className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-1">
              <span>📦</span>
              {loading ? "..." : stats.total_packages_completed}
            </div>
            <div className="text-sm text-slate-600">Entregas exitosas</div>
          </div>
        </div>


        <Button 
          onClick={onViewTrips} 
          className="w-full bg-white/60 hover:bg-white/70 text-slate-800 border-slate-200 backdrop-blur-sm transition-all duration-300 hover:scale-105" 
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
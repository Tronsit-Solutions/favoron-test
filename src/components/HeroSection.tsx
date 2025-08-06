import { Button } from "@/components/ui/button";
import { Package, Plane, Heart, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
interface HeroSectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
}
const HeroSection = ({
  onOpenAuth
}: HeroSectionProps) => {
  // Historical values as base
  const HISTORICAL_TIPS = 30000;
  const HISTORICAL_PACKAGES = 202;
  const HISTORICAL_TRIPS = 110;
  const HISTORICAL_USERS = 188;
  
  const [completedPackages, setCompletedPackages] = useState(HISTORICAL_PACKAGES);
  const [totalUsers, setTotalUsers] = useState(HISTORICAL_USERS);
  const [totalTrips, setTotalTrips] = useState(HISTORICAL_TRIPS);
  const [totalTipsDistributed, setTotalTipsDistributed] = useState(HISTORICAL_TIPS);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching app stats using new function...');

        // Usar la nueva función que bypassa RLS
        const {
          data: statsData,
          error: statsError
        } = await supabase.rpc('get_public_stats');
        console.log('Stats function result:', {
          data: statsData,
          error: statsError
        });
        if (statsError) {
          console.error('Stats function error:', statsError);
          // Fallbacks with historical values
          setTotalUsers(HISTORICAL_USERS);
          setCompletedPackages(HISTORICAL_PACKAGES);
          setTotalTrips(HISTORICAL_TRIPS);
          setTotalTipsDistributed(HISTORICAL_TIPS);
        } else if (statsData && statsData.length > 0) {
          const stats = statsData[0];
          console.log('Setting stats from function:', stats);
          setCompletedPackages(HISTORICAL_PACKAGES + (Number(stats.total_packages_completed) || 0));
          setTotalUsers(HISTORICAL_USERS + (Number(stats.total_users) || 0));
          setTotalTrips(HISTORICAL_TRIPS + (Number(stats.total_trips) || 0));
          setTotalTipsDistributed(HISTORICAL_TIPS + (Number(stats.total_tips_distributed) || 0));
        } else {
          // Fallbacks with historical values
          setTotalUsers(HISTORICAL_USERS);
          setCompletedPackages(HISTORICAL_PACKAGES);
          setTotalTrips(HISTORICAL_TRIPS);
          setTotalTipsDistributed(HISTORICAL_TIPS);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setTotalUsers(HISTORICAL_USERS);
        setCompletedPackages(HISTORICAL_PACKAGES);
        setTotalTrips(HISTORICAL_TRIPS);
        setTotalTipsDistributed(HISTORICAL_TIPS);
      }
    };

    // Fetch inicial
    fetchStats();

    // Actualizar cada 5 minutos en lugar de 30 segundos para reducir carga
    const interval = setInterval(() => {
      fetchStats();
    }, 300000); // 5 minutos

    // Cleanup del interval
    return () => clearInterval(interval);
  }, []);
  return <header className="relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
      
      <div className="relative container mx-auto px-4 pt-12 sm:pt-20 pb-16 sm:pb-24 text-center">
        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-shopper" />
            <span>+{totalUsers} usuarios activos</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" />
            <span>4.8/5 estrellas</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-success" />
            <span>100% seguro</span>
          </div>
        </div>


        {/* Main Headline */}
        <div className="relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-traveler via-shopper to-primary bg-clip-text text-transparent">
              Conectamos compradores
            </span>
            <br />
            <span className="text-gray-900">con viajeros</span>
          </h1>
          
        </div>

        
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" variant="shopper" asChild className="text-base sm:text-lg px-8 py-4 w-64 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <Link to="/auth" state={{ mode: "register" }}>
              <Package className="h-5 w-5 mr-3" />
              Solicitar Paquete
            </Link>
          </Button>
          <Button size="lg" variant="traveler" asChild className="text-base sm:text-lg px-8 py-4 w-64 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <Link to="/auth" state={{ mode: "register" }}>
              <Plane className="h-5 w-5 mr-3" />
              Registrar Viaje
            </Link>
          </Button>
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-shopper mb-2">{completedPackages}+</div>
            <div className="text-gray-600">Paquetes entregados</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-traveler mb-2">{totalTrips}+</div>
            <div className="text-gray-600">Viajes registrados</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-success mb-2">
              Q{totalTipsDistributed > 0 ? totalTipsDistributed.toLocaleString('es-GT') : '0'}
            </div>
            <div className="text-gray-600">Tips ganados</div>
          </div>
        </div>
      </div>
    </header>;
};
export default HeroSection;
import { Button } from "@/components/ui/button";
import { Package, Plane, Heart, Star, Users } from "lucide-react";
import { CustomerPhotosSection } from "@/components/CustomerPhotosSection";
import { usePublicStats } from "@/hooks/usePublicStats";

interface HeroSectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
  isAuthenticated?: boolean;
  userName?: string;
  userRole?: { role: string } | null;
}

const HeroSection = ({
  onOpenAuth,
  isAuthenticated,
  userName,
  userRole
}: HeroSectionProps) => {
  // Use consolidated public stats hook
  const { stats } = usePublicStats();

  return <header className="relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
      
      <div className="relative container mx-auto px-4 pt-2 sm:pt-3 pb-12 sm:pb-20 text-center">
        {/* Trust Indicators - Top Banner */}
        <div className="flex flex-row sm:flex-wrap justify-center items-center gap-4 sm:gap-6 mb-1 text-xs sm:text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-3 border border-white/40 shadow-sm">
               <div className="flex items-center gap-1 sm:gap-2">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span className="hidden sm:inline">{stats.total_users}+ usuarios activos</span>
            <span className="sm:hidden">{stats.total_users}+</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
            <span className="hidden sm:inline">4.9/5 rating</span>
            <span className="sm:hidden">4.9/5</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            <span className="hidden sm:inline">98% entregas efectivas</span>
            <span className="sm:hidden">98%</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 items-center mb-2">
          {/* Left Column - Title and Buttons */}
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
              {isAuthenticated && userName ? (
                <>
                  <span className="bg-gradient-to-r from-success via-primary to-shopper bg-clip-text text-transparent">
                    Bienvenido de vuelta {userName},
                  </span>
                  <br />
                  <span className="text-gray-900">que chilero tenerte aquí!</span>
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-traveler via-shopper to-primary bg-clip-text text-transparent">
                    Conectamos compradores
                  </span>
                  <br />
                  <span className="text-gray-900">con viajeros</span>
                </>
              )}
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 lg:justify-start justify-center">
              {isAuthenticated ? (
                <Button 
                  size="lg" 
                  variant="default" 
                  onClick={() => window.location.href = "/dashboard"} 
                  className="text-base sm:text-lg px-8 py-4 w-64 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Ir a mi Dashboard
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="shopper" onClick={() => onOpenAuth("register")} className="text-base sm:text-lg px-8 py-4 w-64 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    <Package className="h-5 w-5 mr-3" />
                    Solicitar Paquete
                  </Button>
                  <Button size="lg" variant="traveler" onClick={() => onOpenAuth("register")} className="text-base sm:text-lg px-8 py-4 w-64 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    <Plane className="h-5 w-5 mr-3" />
                    Registrar Viaje
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Customer Photos */}
          <div className="flex justify-center lg:justify-end">
            <CustomerPhotosSection isAdmin={userRole?.role === 'admin'} />
          </div>
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-shopper mb-2">{stats.total_packages_completed}+</div>
            <div className="text-gray-600">Paquetes entregados</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-traveler mb-2">{stats.total_trips}+</div>
            <div className="text-gray-600">Viajes registrados</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-success mb-2">
              Q{stats.total_tips_distributed > 0 ? stats.total_tips_distributed.toLocaleString('es-GT') : '0'}
            </div>
            <div className="text-gray-600">Tips ganados</div>
          </div>
        </div>
      </div>
    </header>;
};

export default HeroSection;

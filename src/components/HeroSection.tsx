import { Button } from "@/components/ui/button";
import { Package, Plane, Heart, Star, Users } from "lucide-react";
import { CustomerPhotosSection } from "@/components/CustomerPhotosSection";
import { usePublicStats } from "@/hooks/usePublicStats";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  return <header className="relative overflow-hidden bg-background">
      {/* Modern Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/50"></div>
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-traveler/5"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.1) 0%, transparent 25%), 
                           radial-gradient(circle at 75% 75%, hsl(var(--traveler) / 0.1) 0%, transparent 25%)`
        }}></div>
      </div>
      
      
      {/* Geometric Shapes */}
      <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-primary/20 rotate-45 animate-[spin_20s_linear_infinite]"></div>
      <div className="absolute bottom-1/3 right-1/3 w-12 h-12 bg-gradient-to-br from-traveler/30 to-shopper/30 rounded-full animate-pulse"></div>
      
      <div className="relative container mx-auto px-4 pt-2 sm:pt-3 pb-12 sm:pb-20 text-center">
        {/* Modern Trust Indicators */}
        <div className="flex flex-row sm:flex-wrap justify-center items-center gap-4 sm:gap-6 mb-1 text-xs sm:text-sm text-muted-foreground bg-card/80 backdrop-blur-md rounded-2xl p-4 sm:p-4 border border-border/50 shadow-glow animate-fade-in">
               <div className="flex items-center gap-1 sm:gap-2 group">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary group-hover:text-traveler transition-colors" />
            <span className="hidden sm:inline font-medium">{stats.total_users}+ usuarios activos</span>
            <span className="sm:hidden font-medium">{stats.total_users}+</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 group">
            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-warning text-warning group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-medium">4.9/5 rating</span>
            <span className="sm:hidden font-medium">4.9/5</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 group">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-success group-hover:text-error transition-colors" />
            <span className="hidden sm:inline font-medium">98% entregas efectivas</span>
            <span className="sm:hidden font-medium">98%</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 items-center mb-2">
          {/* Left Column - Title and Buttons */}
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
              {isAuthenticated && userName ? (
                <>
                  {userRole?.role === 'admin' ? (
                    <>
                      <span className="bg-gradient-to-r from-success via-primary to-shopper bg-clip-text text-transparent">
                        ¡Bienvenido de vuelta, Administrador,
                      </span>
                      <br />
                      <span className="text-gray-900">qué chilero tenerte aquí!</span>
                    </>
                  ) : (
                    <>
                      <span className="bg-gradient-to-r from-success via-primary to-shopper bg-clip-text text-transparent">
                        ¡Bienvenido de vuelta, {userName}!
                      </span>
                      <br />
                      <span className="text-gray-900">Qué chilero tenerte por aquí.</span>
                    </>
                  )}
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
                  onClick={() => navigate('/dashboard')} 
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

        {/* Modern Social Proof Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="group bg-card/90 backdrop-blur-md rounded-2xl p-6 shadow-glow border border-border/30 hover:border-shopper/50 transition-all duration-300 hover:shadow-glow-success hover:scale-105">
            <div className="text-3xl font-bold text-shopper mb-2 group-hover:text-primary transition-colors">{stats.total_packages_completed}+</div>
            <div className="text-muted-foreground font-medium">Paquetes entregados</div>
          </div>
          <div className="group bg-card/90 backdrop-blur-md rounded-2xl p-6 shadow-glow border border-border/30 hover:border-traveler/50 transition-all duration-300 hover:shadow-glow-success hover:scale-105">
            <div className="text-3xl font-bold text-traveler mb-2 group-hover:text-primary transition-colors">{stats.total_trips}+</div>
            <div className="text-muted-foreground font-medium">Viajes registrados</div>
          </div>
          <div className="group bg-card/90 backdrop-blur-md rounded-2xl p-6 shadow-glow border border-border/30 hover:border-success/50 transition-all duration-300 hover:shadow-glow-warning hover:scale-105">
            <div className="text-3xl font-bold text-success mb-2 group-hover:text-warning transition-colors">
              Q{stats.total_tips_distributed > 0 ? stats.total_tips_distributed.toLocaleString('es-GT') : '0'}
            </div>
            <div className="text-muted-foreground font-medium">Tips ganados</div>
          </div>
        </div>
      </div>
    </header>;
};

export default HeroSection;

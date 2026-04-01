import { Button } from "@/components/ui/button";
import { Package, Plane, Users, Star, Heart } from "lucide-react";
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
  const { stats } = usePublicStats();
  const navigate = useNavigate();

  return (
    <header className="bg-white">
      <div className="container mx-auto px-4 pt-6 sm:pt-10 pb-12 sm:pb-20">
        {/* Trust bar */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 mb-6 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{stats.total_users}+ usuarios activos</span>
          </div>
          <span className="hidden sm:inline text-border">|</span>
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-warning fill-warning" />
            <span className="font-medium">4.9/5 rating</span>
          </div>
          <span className="hidden sm:inline text-border">|</span>
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-success" />
            <span className="font-medium">98% entregas efectivas</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-10 items-center mb-10">
          {/* Left Column */}
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-foreground">
              {isAuthenticated && userName ? (
                <>
                  {userRole?.role === 'admin' ? (
                    <>
                      <span className="text-primary">¡Bienvenido de vuelta, Administrador,</span>
                      <br />
                      <span>qué chilero tenerte aquí!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-primary">¡Bienvenido de vuelta, {userName}!</span>
                      <br />
                      <span>Qué chilero tenerte por aquí.</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="text-shopper">Conectamos compradores</span>
                  <br />
                  <span>con viajeros</span>
                </>
              )}
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-start justify-center">
              {isAuthenticated ? (
                <Button 
                  size="lg" 
                  variant="default" 
                  onClick={() => navigate('/dashboard')} 
                  className="text-base sm:text-lg px-8 py-4 w-64"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Ir a mi Dashboard
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="shopper" onClick={() => onOpenAuth("register")} className="text-base sm:text-lg px-8 py-4 w-64">
                    <Package className="h-5 w-5 mr-3" />
                    Solicitar Paquete
                  </Button>
                  <Button size="lg" variant="traveler" onClick={() => onOpenAuth("register")} className="text-base sm:text-lg px-8 py-4 w-64">
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="rounded-xl p-6 border border-border bg-white text-center">
            <div className="text-3xl font-bold text-shopper mb-1">{stats.total_packages_completed}+</div>
            <div className="text-muted-foreground text-sm font-medium">Paquetes entregados</div>
          </div>
          <div className="rounded-xl p-6 border border-border bg-white text-center">
            <div className="text-3xl font-bold text-traveler mb-1">{stats.total_trips}+</div>
            <div className="text-muted-foreground text-sm font-medium">Viajes registrados</div>
          </div>
          <div className="rounded-xl p-6 border border-border bg-white text-center">
            <div className="text-3xl font-bold text-success mb-1">
              Q{stats.total_tips_distributed > 0 ? stats.total_tips_distributed.toLocaleString('es-GT') : '0'}
            </div>
            <div className="text-muted-foreground text-sm font-medium">Tips ganados</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;

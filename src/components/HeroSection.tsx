
import { Button } from "@/components/ui/button";
import { Package, Plane, Heart, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeroSectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const HeroSection = ({ onOpenAuth }: HeroSectionProps) => {
  const [completedPackages, setCompletedPackages] = useState(500);
  const [totalUsers, setTotalUsers] = useState(1000);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching app stats...');
        
        // Obtener usuarios totales sin autenticación requerida
        const { count: usersCount, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        console.log('Users query result:', { count: usersCount, error: usersError });
        
        if (usersError) {
          console.error('Users query error:', usersError);
          // Fallback para usuarios
          setTotalUsers(1000);
        } else if (usersCount !== null && usersCount > 0) {
          console.log('Setting total users to:', usersCount);
          setTotalUsers(usersCount);
        } else {
          setTotalUsers(1000); // Fallback
        }
        
        // Para paquetes, usar una consulta directa sin filtros complejos
        console.log('Fetching all packages first...');
        const { data: allPackagesData, error: allError } = await supabase
          .from('packages')
          .select('status');
        
        console.log('All packages result:', { data: allPackagesData, error: allError });
        
        if (allError) {
          console.error('All packages query error:', allError);
          setCompletedPackages(1); // Mostrar al menos 1 para no confundir
        } else if (allPackagesData) {
          // Contar manualmente los completados
          const completedCount = allPackagesData.filter(pkg => 
            ['delivered_to_office', 'received_by_traveler', 'completed'].includes(pkg.status)
          ).length;
          
          console.log('Manual count of completed packages:', completedCount);
          console.log('All statuses found:', allPackagesData.map(p => p.status));
          
          setCompletedPackages(completedCount > 0 ? completedCount : 1);
        } else {
          setCompletedPackages(1); // Fallback
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        setTotalUsers(1000);
        setCompletedPackages(1);
      }
    };

    fetchStats();
  }, []);

  return (
    <header className="relative overflow-hidden">
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
          
          {/* Decorative element */}
          <div className="absolute -top-2 -right-4 sm:-right-8">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-80 animate-pulse"></div>
          </div>
        </div>

        <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
          ¿Necesitas algo del extranjero? ¿Viajas y quieres ganar dinero extra? 
          <br className="hidden sm:block" />
          <span className="font-semibold text-gray-800">Te conectamos para que ambos ganen</span> ✨
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            size="lg" 
            variant="shopper" 
            onClick={() => onOpenAuth("register")} 
            className="text-base sm:text-lg px-8 py-4 w-64 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Package className="h-5 w-5 mr-3" />
            Solicitar Paquete
          </Button>
          <Button 
            size="lg" 
            variant="traveler" 
            onClick={() => onOpenAuth("register")} 
            className="text-base sm:text-lg px-8 py-4 w-64 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plane className="h-5 w-5 mr-3" />
            Registrar Viaje
          </Button>
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-shopper mb-2">{completedPackages}+</div>
            <div className="text-gray-600">Paquetes entregados</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-traveler mb-2">50+</div>
            <div className="text-gray-600">Destinos disponibles</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50">
            <div className="text-2xl font-bold text-success mb-2">99%</div>
            <div className="text-gray-600">Entregas exitosas</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;

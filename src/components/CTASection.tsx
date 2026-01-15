import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Check, Plane } from "lucide-react";
import { usePublicStats } from "@/hooks/usePublicStats";

interface CTASectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const CTASection = ({
  onOpenAuth
}: CTASectionProps) => {
  // Reuse the cached stats hook instead of fetching separately
  const { stats } = usePublicStats();
  const totalUsers = stats.total_users;

  return (
    <section className="relative py-20 bg-gradient-to-br from-shopper via-traveler to-primary overflow-hidden animate-fade-in">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-shopper/90 to-traveler/90"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-white/10 to-primary/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-l from-accent/20 to-secondary/20 rounded-full blur-3xl opacity-40"></div>
      
      <div className="container mx-auto px-4 text-center relative">
        {/* Background Airplane */}
        <Plane className="absolute inset-0 w-96 h-96 text-white/10 -rotate-12 mx-auto my-auto" style={{ top: '50%', left: '65%', transform: 'translate(-50%, -50%) rotate(-12deg)' }} />
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-8">
          <Sparkles className="h-4 w-4" />
          <span>¡Únete a más de {totalUsers.toLocaleString()} usuarios!</span>
        </div>

        {/* Main Headline */}
        <h3 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
          ¿Listo para unirte a la
          <br />
          <span className="text-white font-bold">
            comunidad más chilera de Guatemala?
          </span>
        </h3>
        
        <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
          Únete a nuestra comunidad y comienza a enviar o traer paquetes hoy mismo.
          <br className="hidden sm:block" />
          <span className="font-semibold">Es gratis y solo toma 2 minutos.</span>
        </p>
        
        {/* CTA Button */}
        <Button 
          size="lg" 
          onClick={() => onOpenAuth("register")} 
          className="text-lg px-12 py-6 bg-white text-shopper hover:bg-gray-50 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold"
        >
          <span>Crear Cuenta Gratis</span>
          <ArrowRight className="ml-3 h-5 w-5" />
        </Button>
        
        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 text-white/90">
            <Check className="h-5 w-5 text-success" />
            <span className="font-medium">100% gratis para empezar</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/90">
            <Check className="h-5 w-5 text-success" />
            <span className="font-medium">Registro en 2 minutos</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-white/90">
            <Check className="h-5 w-5 text-success" />
            <span className="font-medium">Soporte 24/7</span>
          </div>
        </div>
        
        {/* Trust indicators */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-white/70 text-sm">
            Confiado por <span className="font-semibold text-white">+{totalUsers.toLocaleString()} usuarios</span> en Guatemala y el mundo
          </p>
        </div>
      </div>
    </section>
  );
};
export default CTASection;
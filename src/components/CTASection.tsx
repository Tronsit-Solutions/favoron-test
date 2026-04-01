import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { usePublicStats } from "@/hooks/usePublicStats";

interface CTASectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const CTASection = ({ onOpenAuth }: CTASectionProps) => {
  const { stats } = usePublicStats();
  const totalUsers = stats.total_users;

  return (
    <section className="py-20 bg-foreground">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 text-white leading-tight">
          ¿Listo para unirte a la
          <br />
          comunidad más chilera de Guatemala?
        </h3>
        
        <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
          Únete a nuestra comunidad y comienza a enviar o traer paquetes hoy mismo.
          <br className="hidden sm:block" />
          <span className="font-semibold text-white/90">Es gratis y solo toma 2 minutos.</span>
        </p>
        
        <Button 
          size="lg" 
          onClick={() => onOpenAuth("register")} 
          className="text-lg px-10 py-6 bg-white text-foreground hover:bg-white/90 font-bold"
        >
          Crear Cuenta Gratis
          <ArrowRight className="ml-3 h-5 w-5" />
        </Button>
        
        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
          {["100% gratis para empezar", "Registro en 2 minutos", "Soporte 24/7"].map((text, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-white/70">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-white/50 text-sm">
            Confiado por <span className="font-semibold text-white/70">+{totalUsers.toLocaleString()} usuarios</span> en Guatemala y el mundo
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

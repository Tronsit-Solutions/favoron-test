
import { Button } from "@/components/ui/button";
import { Package, Plane } from "lucide-react";

interface HeroSectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const HeroSection = ({ onOpenAuth }: HeroSectionProps) => {
  return (
    <header className="container mx-auto px-4 pt-16 pb-24 text-center">
      <h2 className="text-5xl font-bold text-gray-900 mb-6">
        Conectamos viajeros con compradores
      </h2>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        ¿Necesitas algo del extranjero? ¿Viajas y quieres ganar dinero? 
        Te conectamos para hacer que ambos ganen.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" onClick={() => onOpenAuth("register")} className="text-lg px-8 py-3">
          <Package className="h-5 w-5 mr-2" />
          Solicitar Paquete
        </Button>
        <Button size="lg" variant="secondary" onClick={() => onOpenAuth("register")} className="text-lg px-8 py-3">
          <Plane className="h-5 w-5 mr-2" />
          Registrar Viaje
        </Button>
      </div>
    </header>
  );
};

export default HeroSection;

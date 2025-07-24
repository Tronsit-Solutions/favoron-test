
import { Button } from "@/components/ui/button";
import { Package, Plane } from "lucide-react";

interface HeroSectionProps {
  onOpenAuth: (mode: "login" | "register") => void;
}

const HeroSection = ({ onOpenAuth }: HeroSectionProps) => {
  return (
    <header className="container mx-auto px-4 pt-8 sm:pt-16 pb-16 sm:pb-24 text-center">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
        Conectamos viajeros con compradores
      </h2>
      <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
        ¿Necesitas algo del extranjero? ¿Viajas y quieres ganar dinero? 
        Te conectamos para hacer que ambos ganen.
      </p>
      
      <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center">
        <Button 
          size="lg" 
          variant="shopper" 
          onClick={() => onOpenAuth("register")} 
          className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-56"
        >
          <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Solicitar Paquete
        </Button>
        <Button 
          size="lg" 
          variant="traveler" 
          onClick={() => onOpenAuth("register")} 
          className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-56 flex items-center justify-center"
        >
          <Plane className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Registrar Viaje
        </Button>
      </div>
    </header>
  );
};

export default HeroSection;

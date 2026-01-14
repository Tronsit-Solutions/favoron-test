import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, Users, DollarSign, ShoppingCart, Package } from "lucide-react";

interface ShopperOnboardingProps {
  onCreatePackage: () => void;
}

const steps = [
  {
    icon: Search,
    title: "Crea tu solicitud",
    description: "Describe el producto que necesitas y desde dónde"
  },
  {
    icon: Users,
    title: "Te emparejamos con un viajero",
    description: "Conectamos tu solicitud con viajeros verificados"
  },
  {
    icon: DollarSign,
    title: "Recibe cotización por el servicio",
    description: "El viajero te envía el costo solo por traer tu paquete (tú compras el producto por tu cuenta)"
  },
  {
    icon: ShoppingCart,
    title: "Compras y envías al viajero",
    description: "Realizas la compra del producto y lo envías a la dirección del viajero en el exterior"
  },
  {
    icon: Package,
    title: "Retira en oficina Favoron",
    description: "Recoge tu producto cuando el viajero lo entregue"
  }
];

const ShopperOnboarding = ({ onCreatePackage }: ShopperOnboardingProps) => {
  return (
    <Card className="mobile-content border-shopper/20 bg-gradient-to-br from-shopper/5 to-background">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-shopper/10 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-shopper" />
        </div>
        <CardTitle className="text-xl sm:text-2xl">¡Bienvenido a Favoron!</CardTitle>
        <p className="text-muted-foreground text-sm sm:text-base mt-1">
          Conoce cómo funciona el proceso:
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex gap-3 p-3 rounded-lg bg-background/60 border border-border/50 hover:border-shopper/30 transition-colors"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-shopper/10 flex items-center justify-center text-shopper font-semibold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <step.icon className="h-4 w-4 text-shopper flex-shrink-0" />
                  <h4 className="font-medium text-sm sm:text-base">{step.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 text-center">
          <Button 
            variant="shopper" 
            size="lg" 
            onClick={onCreatePackage}
            className="w-full sm:w-auto px-8"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Crear mi Primer Favorón
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShopperOnboarding;

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Truck, Percent, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PrimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const PrimeModal = ({ isOpen, onClose, user }: PrimeModalProps) => {
  const isPrimeUser = user?.trustLevel === 'prime' || user?.trust_level === 'prime';

  const benefits = [
    {
      icon: Percent,
      title: "50% de descuento en tarifas Favorón",
      description: "Paga la mitad en comisiones por cada paquete",
    },
    {
      icon: Truck,
      title: "Entregas a domicilio gratis en la capital",
      description: "Sin costo adicional por delivery en Ciudad de Guatemala",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative h-16 w-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
            Favorón Prime
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status for Prime users */}
          {isPrimeUser && (
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-center mb-2">
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Miembro Activo
                </Badge>
              </div>
              <p className="text-sm text-amber-700">
                ¡Ya eres miembro Prime! Disfruta de todos los beneficios.
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Beneficios exclusivos</h3>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing for non-Prime users */}
          {!isPrimeUser && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg border">
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg font-bold text-primary">Q200</span>
                    <span className="text-sm text-muted-foreground line-through">Q500</span>
                    <Badge variant="destructive" className="text-xs">60% OFF</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Membresía anual</p>
                  <p className="text-xs text-amber-600 font-medium">
                    ¡Oferta por tiempo limitado!
                  </p>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade a Prime
              </Button>
            </div>
          )}

          {/* Prime user actions */}
          {isPrimeUser && (
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                Ver mis beneficios utilizados
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Tu membresía vence el 31 de diciembre, 2024
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrimeModal;
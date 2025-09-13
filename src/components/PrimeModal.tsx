import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Truck, Percent, Sparkles, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePrimePayment } from "@/hooks/usePrimePayment";
import FavoronBankingInfoDisplay from "@/components/admin/FavoronBankingInfoDisplay";

interface PrimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const PrimeModal = ({ isOpen, onClose, user }: PrimeModalProps) => {
  const isPrimeUser = user?.trustLevel === 'prime' || user?.trust_level === 'prime';
  const { createPrimePaymentOrder, isCreating, favoronAccount, bankingLoading } = usePrimePayment();

  const handleUpgradeToPrime = async () => {
    const result = await createPrimePaymentOrder();
    if (result.success) {
      onClose();
    }
  };

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
            <div className="relative h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-300 rounded-full animate-pulse"></div>
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Favorón Prime
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status for Prime users */}
          {isPrimeUser && (
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-center mb-2">
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Miembro Activo
                </Badge>
              </div>
              <p className="text-sm text-purple-700">
                ¡Ya eres miembro Prime! Disfruta de todos los beneficios.
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Beneficios exclusivos</h3>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-4 w-4 text-purple-600" />
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
                  <p className="text-xs text-purple-600 font-medium">
                    ¡Oferta por tiempo limitado!
                  </p>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                onClick={handleUpgradeToPrime}
                disabled={isCreating || bankingLoading || !favoronAccount}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isCreating ? 'Procesando...' : 'Crear solicitud de pago'}
              </Button>
              
              {favoronAccount && !bankingLoading && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                    Información de pago a Favorón:
                  </h4>
                  <FavoronBankingInfoDisplay account={favoronAccount} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Realiza el pago de Q200 y un administrador aprobará tu membresía Prime.
                  </p>
                </div>
              )}
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
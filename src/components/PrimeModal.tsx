import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Truck, Percent, Sparkles, CreditCard, Copy, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePrimePayment } from "@/hooks/usePrimePayment";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PrimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
}

const PrimeModal = ({ isOpen, onClose, user }: PrimeModalProps) => {
  const isPrimeUser = user?.trustLevel === 'prime' || user?.trust_level === 'prime';
  const { createPrimePaymentOrder, isCreating, favoronAccount, bankingLoading } = usePrimePayment();
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const { toast } = useToast();

  const handlePayPrime = async () => {
    const result = await createPrimePaymentOrder();
    if (result.success) {
      setShowPaymentInfo(true);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
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

              {!showPaymentInfo ? (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  onClick={handlePayPrime}
                  disabled={isCreating || bankingLoading || !favoronAccount}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isCreating ? 'Procesando...' : 'Pagar Membresía Prime'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-800">¡Solicitud creada exitosamente!</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Completa tu pago con la información bancaria de abajo
                    </p>
                  </div>

                  {favoronAccount && (
                    <Card className="border-purple-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Información para transferencia bancaria
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                            <div>
                              <span className="text-sm text-purple-600">Banco:</span>
                              <p className="font-medium">{favoronAccount.bank_name}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(favoronAccount.bank_name, "Banco")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                            <div>
                              <span className="text-sm text-purple-600">Titular:</span>
                              <p className="font-medium">{favoronAccount.account_holder}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(favoronAccount.account_holder, "Titular")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                            <div>
                              <span className="text-sm text-purple-600">No. de Cuenta:</span>
                              <p className="font-medium font-mono">{favoronAccount.account_number}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(favoronAccount.account_number, "Número de cuenta")}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                            <div>
                              <span className="text-sm text-purple-600">Tipo de Cuenta:</span>
                              <p className="font-medium capitalize">{favoronAccount.account_type}</p>
                            </div>
                          </div>

                          <div className="text-center p-3 bg-purple-100 rounded-lg">
                            <p className="text-lg font-bold text-purple-800">Monto a transferir: Q200.00</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 mb-2">Instrucciones de pago:</h5>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Realiza la transferencia bancaria por Q200.00</li>
                      <li>Guarda el comprobante de la transferencia</li>
                      <li>Un administrador verificará tu pago</li>
                      <li>Tu membresía Prime se activará automáticamente</li>
                    </ol>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowPaymentInfo(false)}
                    >
                      Volver
                    </Button>
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={onClose}
                    >
                      Entendido
                    </Button>
                  </div>
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
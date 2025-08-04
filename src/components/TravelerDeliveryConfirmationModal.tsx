import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStatusLabel } from "@/lib/formatters";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, 
  DollarSign, 
  Building, 
  Truck, 
  Shield, 
  CreditCard,
  CheckCircle,
  Package
} from "lucide-react";

interface TravelerDeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
  packages: any[];
  travelerProfile: any;
  onConfirmDelivery: () => void;
}

const TravelerDeliveryConfirmationModal = ({
  isOpen,
  onClose,
  trip,
  packages,
  travelerProfile,
  onConfirmDelivery
}: TravelerDeliveryConfirmationModalProps) => {
  const [deliveryMethod, setDeliveryMethod] = useState<string>("");
  const [bankInfo, setBankInfo] = useState({
    bank_account_holder: travelerProfile?.bank_account_holder || "",
    bank_name: travelerProfile?.bank_name || "",
    bank_account_type: travelerProfile?.bank_account_type || "",
    bank_account_number: travelerProfile?.bank_account_number || "",
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { createPaymentOrder } = usePaymentOrders();

  // Calcular el total a pagar al viajero
  const totalAmount = packages.reduce((sum, pkg) => {
    if (pkg.quote?.price) {
      return sum + parseFloat(pkg.quote.price);
    }
    return sum;
  }, 0);

  const handleBankInfoChange = (field: string, value: string) => {
    setBankInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmDelivery = async () => {
    if (!deliveryMethod) {
      toast({
        title: "Error",
        description: "Por favor selecciona el método de entrega",
        variant: "destructive",
      });
      return;
    }

    if (!bankInfo.bank_account_holder || !bankInfo.bank_name || !bankInfo.bank_account_number) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos bancarios obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Actualizar información bancaria del perfil para cuando se apruebe
      await supabase
        .from('profiles')
        .update({
          bank_account_holder: bankInfo.bank_account_holder,
          bank_name: bankInfo.bank_name,
          bank_account_type: bankInfo.bank_account_type,
          bank_account_number: bankInfo.bank_account_number,
        })
        .eq('id', travelerProfile.id);

      // Solo actualizar estado de todos los paquetes con declaración del viajero
      // NO crear payment orders todavía - eso lo hará el admin al confirmar
      for (const pkg of packages) {
        const travelerDeclaration = {
          timestamp: new Date().toISOString(),
          delivery_method: deliveryMethod,
          notes: notes,
          traveler_id: travelerProfile.id,
          bank_info: {
            bank_account_holder: bankInfo.bank_account_holder,
            bank_name: bankInfo.bank_name,
            bank_account_type: bankInfo.bank_account_type,
            bank_account_number: bankInfo.bank_account_number,
          }
        };

        await supabase
          .from('packages')
          .update({ 
            status: 'pending_office_confirmation',
            office_delivery: {
              traveler_declaration: travelerDeclaration,
              status: 'pending_admin_confirmation'
            }
          })
          .eq('id', pkg.id);
      }

      toast({
        title: "Declaración de entrega registrada",
        description: "El equipo de Favorón debe confirmar la recepción antes de procesar tu pago.",
      });

      onConfirmDelivery();
      onClose();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la declaración de entrega",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Declarar entrega de paquetes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen del viaje */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Resumen del viaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ruta:</span>
                  <span className="font-medium">{trip.from_city} → {trip.to_city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paquetes:</span>
                  <span className="font-medium">{packages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total a recibir:</span>
                  <span className="font-bold text-green-600 text-lg">Q{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Método de entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="oficina" id="oficina" />
                  <Label htmlFor="oficina" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Entregué en oficina Favorón Zona 14</p>
                      <p className="text-sm text-muted-foreground">Paquetes entregados en oficina</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="mensajero" id="mensajero" />
                  <Label htmlFor="mensajero" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Truck className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Entregué al mensajero Favorón</p>
                      <p className="text-sm text-muted-foreground">Paquetes entregados a mensajero</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Información bancaria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información bancaria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Shield className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  Favorón nunca compartirá esta información con otros usuarios.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="holder">Nombre del titular *</Label>
                  <Input
                    id="holder"
                    value={bankInfo.bank_account_holder}
                    onChange={(e) => handleBankInfoChange('bank_account_holder', e.target.value)}
                    placeholder="Nombre completo del titular"
                  />
                </div>
                <div>
                  <Label htmlFor="bank">Banco *</Label>
                  <Input
                    id="bank"
                    value={bankInfo.bank_name}
                    onChange={(e) => handleBankInfoChange('bank_name', e.target.value)}
                    placeholder="Nombre del banco"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de cuenta</Label>
                  <Input
                    id="type"
                    value={bankInfo.bank_account_type}
                    onChange={(e) => handleBankInfoChange('bank_account_type', e.target.value)}
                    placeholder="Ahorro, Corriente, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número de cuenta *</Label>
                  <Input
                    id="number"
                    value={bankInfo.bank_account_number}
                    onChange={(e) => handleBankInfoChange('bank_account_number', e.target.value)}
                    placeholder="Número de cuenta"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional sobre la entrega..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Paquetes incluidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Paquetes incluidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                    <div>
                      <p className="font-medium">{pkg.item_description}</p>
                      <p className="text-sm text-muted-foreground">Paquete #{pkg.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Q{pkg.quote?.price || '0.00'}</p>
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(pkg.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={loading || !deliveryMethod}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Procesando..." : "Declarar entrega (requiere confirmación admin)"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TravelerDeliveryConfirmationModal;
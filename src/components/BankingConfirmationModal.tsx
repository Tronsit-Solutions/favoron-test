import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Building, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BankingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: any;
  travelerProfile: any;
  onConfirm: () => void;
}

const BankingConfirmationModal = ({ 
  isOpen, 
  onClose, 
  pkg, 
  travelerProfile, 
  onConfirm 
}: BankingConfirmationModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankingInfo, setBankingInfo] = useState({
    bankAccountHolder: travelerProfile?.bank_account_holder || '',
    bankName: travelerProfile?.bank_name || '',
    bankAccountNumber: travelerProfile?.bank_account_number || '',
    bankAccountType: travelerProfile?.bank_account_type || ''
  });

  const handleConfirmPayment = async () => {
    if (!bankingInfo.bankAccountHolder || !bankingInfo.bankName || !bankingInfo.bankAccountNumber || !bankingInfo.bankAccountType) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos de información bancaria.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // First update package status to delivered_to_office
      const { error: packageUpdateError } = await supabase
        .from('packages')
        .update({
          status: 'delivered_to_office',
          office_delivery: {
            confirmedAt: new Date().toISOString()
          }
        })
        .eq('id', pkg.id);

      if (packageUpdateError) {
        throw packageUpdateError;
      }
      // First, update the traveler's financial data with the banking information
      const { error: profileError } = await supabase
        .from('user_financial_data')
        .upsert({
          user_id: travelerProfile.id,
          bank_account_holder: bankingInfo.bankAccountHolder,
          bank_name: bankingInfo.bankName,
          bank_account_number: bankingInfo.bankAccountNumber,
          bank_account_type: bankingInfo.bankAccountType,
        })
        .eq('user_id', travelerProfile.id);

      if (profileError) {
        throw profileError;
      }

      // Calculate the payment amount (traveler's tip from quote)
      const amount = pkg.quote?.price ? parseFloat(pkg.quote.price) : 0;

      // Create payment order
      const { error: paymentError } = await supabase
        .from('payment_orders')
        .insert({
          trip_id: pkg.matched_trip_id,
          traveler_id: travelerProfile.id,
          amount: amount,
          bank_account_holder: bankingInfo.bankAccountHolder,
          bank_name: bankingInfo.bankName,
          bank_account_number: bankingInfo.bankAccountNumber,
          bank_account_type: bankingInfo.bankAccountType,
          status: 'pending'
        });

      if (paymentError) {
        throw paymentError;
      }

      // Get admin user ID for notification
      const { data: adminUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);

      if (adminUsers && adminUsers.length > 0) {
        const { error: notificationError } = await supabase
          .rpc('create_notification', {
            _user_id: adminUsers[0].user_id,
            _title: 'Solicitud de pago pendiente',
            _message: `Viaje completado. Confirmar pago a ${bankingInfo.bankAccountHolder} por $${amount.toFixed(2)}`,
            _type: 'payment_request',
            _priority: 'high',
            _action_url: `/admin/payments`,
            _metadata: {
              packageId: pkg.id,
              travelerId: travelerProfile.id,
              amount: amount
            }
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }


      toast({
        title: "¡Solicitud de pago generada!",
        description: "Tu información bancaria ha sido confirmada y se ha generado la orden de pago.",
      });

      onConfirm();
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la solicitud de pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Confirmación de pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Gracias por entregar los paquetes. Confirma tu información bancaria para recibir tu pago.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium">Pago a recibir:</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              Q{pkg.quote?.price ? parseFloat(pkg.quote.price).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Compensación por completar el Favorón
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankAccountHolder" className="text-sm font-medium">
                  Nombre de cuenta
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bankAccountHolder"
                    value={bankingInfo.bankAccountHolder}
                    onChange={(e) => setBankingInfo(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                    placeholder="Nombre completo del titular"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-sm font-medium">
                  Nombre del banco
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bankName"
                    value={bankingInfo.bankName}
                    onChange={(e) => setBankingInfo(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Ej: Banco Industrial"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber" className="text-sm font-medium">
                  Número de cuenta
                </Label>
                <Input
                  id="bankAccountNumber"
                  value={bankingInfo.bankAccountNumber}
                  onChange={(e) => setBankingInfo(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                  placeholder="Número de cuenta bancaria"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountType" className="text-sm font-medium">
                  Tipo de cuenta
                </Label>
                <Select
                  value={bankingInfo.bankAccountType}
                  onValueChange={(value) => setBankingInfo(prev => ({ ...prev, bankAccountType: value }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona tipo de cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monetaria">Monetaria</SelectItem>
                    <SelectItem value="ahorros">Ahorros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmPayment}
              disabled={loading}
              className="flex-1 h-11"
            >
              {loading ? "Procesando..." : "Confirmar y generar pago"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BankingConfirmationModal;
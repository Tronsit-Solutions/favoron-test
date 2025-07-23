import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Building, Shield, CheckCircle, Edit, Eye } from "lucide-react";
import { formatCurrency } from "@/utils/priceHelpers";

interface TripBankingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bankingInfo: any) => void;
  amount: number;
  currentBankingInfo: any;
  title?: string;
  description?: string;
}

const TripBankingConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  amount,
  currentBankingInfo,
  title = "Confirmación de pago",
  description
}: TripBankingConfirmationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bankingInfo, setBankingInfo] = useState({
    bank_account_holder: currentBankingInfo?.bank_account_holder || '',
    bank_name: currentBankingInfo?.bank_name || '',
    bank_account_number: currentBankingInfo?.bank_account_number || '',
    bank_account_type: currentBankingInfo?.bank_account_type || ''
  });

  // Determinar si tiene información bancaria completa
  const hasCompleteBankingInfo = currentBankingInfo?.bank_account_holder && 
                                  currentBankingInfo?.bank_name && 
                                  currentBankingInfo?.bank_account_number && 
                                  currentBankingInfo?.bank_account_type;

  // Establecer modo inicial basado en si tiene información completa
  useEffect(() => {
    setIsEditing(!hasCompleteBankingInfo);
  }, [hasCompleteBankingInfo]);

  // Actualizar información cuando cambie currentBankingInfo
  useEffect(() => {
    setBankingInfo({
      bank_account_holder: currentBankingInfo?.bank_account_holder || '',
      bank_name: currentBankingInfo?.bank_name || '',
      bank_account_number: currentBankingInfo?.bank_account_number || '',
      bank_account_type: currentBankingInfo?.bank_account_type || ''
    });
  }, [currentBankingInfo]);

  const handleConfirmPayment = async () => {
    if (!bankingInfo.bank_account_holder || !bankingInfo.bank_name || !bankingInfo.bank_account_number || !bankingInfo.bank_account_type) {
      return;
    }

    setLoading(true);
    
    try {
      await onConfirm(bankingInfo);
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = bankingInfo.bank_account_holder && 
                      bankingInfo.bank_name && 
                      bankingInfo.bank_account_number && 
                      bankingInfo.bank_account_type;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {hasCompleteBankingInfo && !isEditing 
                ? "Revisa tu información bancaria registrada para recibir tu pago." 
                : "Ingresa tu información bancaria para recibir tu pago por el viaje completo."
              }
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium">Pago a recibir:</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tips acumulados por entrega de todos los paquetes del viaje
            </p>
          </div>

          {/* Vista de confirmación - mostrar información guardada */}
          {hasCompleteBankingInfo && !isEditing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Información bancaria registrada:</span>
              </div>
              
              <div className="bg-muted/20 border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nombre de cuenta</Label>
                    <p className="font-medium">{currentBankingInfo.bank_account_holder}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Banco</Label>
                    <p className="font-medium">{currentBankingInfo.bank_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Número de cuenta</Label>
                    <p className="font-medium">{currentBankingInfo.bank_account_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo de cuenta</Label>
                    <p className="font-medium capitalize">{currentBankingInfo.bank_account_type}</p>
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
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="flex-1 h-11"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar información
                </Button>
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="flex-1 h-11"
                >
                  {loading ? "Procesando..." : "Confirmar y solicitar pago"}
                </Button>
              </div>
            </div>
          )}

          {/* Vista de edición - formulario de información bancaria */}
          {(!hasCompleteBankingInfo || isEditing) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Edit className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">
                  {hasCompleteBankingInfo ? "Editar información bancaria:" : "Ingresa tu información bancaria:"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankAccountHolder" className="text-sm font-medium">
                    Nombre de cuenta
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bankAccountHolder"
                      value={bankingInfo.bank_account_holder}
                      onChange={(e) => setBankingInfo(prev => ({ ...prev, bank_account_holder: e.target.value }))}
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
                      value={bankingInfo.bank_name}
                      onChange={(e) => setBankingInfo(prev => ({ ...prev, bank_name: e.target.value }))}
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
                    value={bankingInfo.bank_account_number}
                    onChange={(e) => setBankingInfo(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    placeholder="Número de cuenta bancaria"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountType" className="text-sm font-medium">
                    Tipo de cuenta
                  </Label>
                  <Select
                    value={bankingInfo.bank_account_type}
                    onValueChange={(value) => setBankingInfo(prev => ({ ...prev, bank_account_type: value }))}
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 h-11"
                >
                  Cancelar
                </Button>
                {hasCompleteBankingInfo && (
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="flex-1 h-11"
                  >
                    Ver información guardada
                  </Button>
                )}
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={loading || !isFormValid}
                  className="flex-1 h-11"
                >
                  {loading ? "Procesando..." : "Confirmar y solicitar pago"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripBankingConfirmationModal;
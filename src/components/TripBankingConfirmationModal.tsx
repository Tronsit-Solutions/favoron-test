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
      <DialogContent className="max-w-md w-[95vw] mx-auto max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-3 pt-3 pb-3 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 pb-2">
          <div className="space-y-2">
          <Alert className="py-1">
            <Shield className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {hasCompleteBankingInfo && !isEditing 
                ? "Revisa tu información bancaria." 
                : "Ingresa tu información bancaria."
              }
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 border rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <CreditCard className="h-3 w-3 text-primary" />
              <span className="font-medium text-xs">Pago:</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              Tips del viaje
            </p>
          </div>

          {/* Vista de confirmación - mostrar información guardada */}
          {hasCompleteBankingInfo && !isEditing && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 mb-1">
                <Eye className="h-3 w-3 text-primary" />
                <span className="font-medium text-xs">Información bancaria:</span>
              </div>
              
              <div className="bg-muted/20 border rounded-lg p-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-xs text-muted-foreground">Titular</Label>
                    <p className="font-medium truncate text-xs">{currentBankingInfo.bank_account_holder}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Banco</Label>
                    <p className="font-medium truncate text-xs">{currentBankingInfo.bank_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Cuenta</Label>
                    <p className="font-medium truncate text-xs">{currentBankingInfo.bank_account_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <p className="font-medium capitalize truncate text-xs">{currentBankingInfo.bank_account_type}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 pt-2 border-t">
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 h-8 text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    disabled={loading}
                    className="flex-1 h-8 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                </div>
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="w-full h-8 text-xs"
                >
                  {loading ? "Procesando..." : "Confirmar y solicitar pago"}
                </Button>
              </div>
            </div>
          )}

          {/* Vista de edición - formulario de información bancaria */}
          {(!hasCompleteBankingInfo || isEditing) && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 mb-1">
                <Edit className="h-3 w-3 text-primary" />
                <span className="font-medium text-xs">
                  {hasCompleteBankingInfo ? "Editar:" : "Ingresa información:"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="bankAccountHolder" className="text-xs font-medium">
                    Titular
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="bankAccountHolder"
                      value={bankingInfo.bank_account_holder}
                      onChange={(e) => setBankingInfo(prev => ({ ...prev, bank_account_holder: e.target.value }))}
                      placeholder="Nombre completo"
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="bankName" className="text-xs font-medium">
                      Banco
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="bankName"
                        value={bankingInfo.bank_name}
                        onChange={(e) => setBankingInfo(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="ej: BI"
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bankAccountType" className="text-xs font-medium">
                      Tipo
                    </Label>
                    <Select
                      value={bankingInfo.bank_account_type}
                      onValueChange={(value) => setBankingInfo(prev => ({ ...prev, bank_account_type: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monetaria">Monetaria</SelectItem>
                        <SelectItem value="ahorros">Ahorros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bankAccountNumber" className="text-xs font-medium">
                    Número de cuenta
                  </Label>
                  <Input
                    id="bankAccountNumber"
                    value={bankingInfo.bank_account_number}
                    onChange={(e) => setBankingInfo(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    placeholder="Número de cuenta"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 pt-2 border-t">
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 h-8 text-xs"
                  >
                    Cancelar
                  </Button>
                  {hasCompleteBankingInfo && (
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                      className="flex-1 h-8 text-xs"
                    >
                      Ver guardada
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={loading || !isFormValid}
                  className="w-full h-8 text-xs"
                >
                  {loading ? "Procesando..." : "Confirmar y solicitar pago"}
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripBankingConfirmationModal;
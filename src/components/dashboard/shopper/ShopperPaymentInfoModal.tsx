import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavoronBankingInfo } from "@/hooks/useFavoronBankingInfo";
import PaymentReceiptUpload from "./PaymentReceiptUpload";
import { Package } from "@/types";

interface ShopperPaymentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: Package;
  onUploadComplete: (updatedPkg: Package) => void;
}

export default function ShopperPaymentInfoModal({ 
  isOpen, 
  onClose, 
  pkg, 
  onUploadComplete 
}: ShopperPaymentInfoModalProps) {
  const { toast } = useToast();
  const { account: bankAccount, loading: bankLoading } = useFavoronBankingInfo(pkg.id);
  const [currentPkg, setCurrentPkg] = useState(pkg);
  
  const totalAmount = parseFloat((pkg.quote as any)?.totalPrice || '0');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado",
        description: `${label} copiado al portapapeles`,
      });
    });
  };

  const handleUploadComplete = (updatedPkg: Package) => {
    setCurrentPkg(updatedPkg);
    onUploadComplete(updatedPkg);
  };

  // Show success state if receipt was uploaded
  const showSuccessState = currentPkg.payment_receipt && currentPkg.status === 'payment_pending_approval';

  const handleModalClose = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información de Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Amount */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monto a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                Q{totalAmount.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Por el paquete: {pkg.item_description}
              </p>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Datos Bancarios de Favorón</CardTitle>
            </CardHeader>
            <CardContent>
              {bankLoading ? (
                <p className="text-sm text-muted-foreground">Cargando información bancaria...</p>
              ) : bankAccount ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Banco</p>
                        <p className="font-medium">{bankAccount.bank_name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bankAccount.bank_name, "Nombre del banco")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Número de Cuenta</p>
                        <p className="font-medium">{bankAccount.account_number}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bankAccount.account_number, "Número de cuenta")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Titular de la Cuenta</p>
                        <p className="font-medium">{bankAccount.account_holder}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bankAccount.account_holder, "Titular de la cuenta")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de Cuenta</p>
                        <p className="font-medium">{bankAccount.account_type}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bankAccount.account_type, "Tipo de cuenta")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se pudo cargar la información bancaria. Por favor contacta al soporte.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Instrucciones de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>1. Realiza una transferencia bancaria por el monto exacto: <strong>Q{totalAmount.toFixed(2)}</strong></p>
                <p>2. Utiliza los datos bancarios de Favorón mostrados arriba</p>
                <p>3. Una vez completada la transferencia, sube tu comprobante de pago abajo</p>
                <p>4. Nuestro equipo verificará tu pago en las próximas 24 horas</p>
              </div>
            </CardContent>
          </Card>

          {/* Upload Receipt Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Subir Comprobante de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              {showSuccessState ? (
                <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                  <div>
                    <p className="font-medium text-success">¡Comprobante subido exitosamente!</p>
                    <p className="text-sm text-success/80">
                      Tu pago está siendo verificado por nuestro equipo. Te notificaremos cuando sea aprobado.
                    </p>
                  </div>
                </div>
              ) : (
                <PaymentReceiptUpload 
                  pkg={currentPkg} 
                  onUploadComplete={handleUploadComplete}
                />
              )}
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
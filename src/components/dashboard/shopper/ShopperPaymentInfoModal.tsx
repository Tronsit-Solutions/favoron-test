import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, CreditCard, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavoronBankingInfo } from "@/hooks";
import { useAuth } from "@/hooks/useAuth";
import { getPriceBreakdown } from "@/lib/pricing";
import PaymentReceiptUpload from "./PaymentReceiptUpload";
import { Package } from "@/types";
import { PartialDeliveryInfo } from "../PartialDeliveryInfo";

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
  const { profile } = useAuth();
  const { account: bankAccount, loading: bankLoading } = useFavoronBankingInfo(pkg.id);
  const [currentPkg, setCurrentPkg] = useState(pkg);
  const [closeLocked, setCloseLocked] = useState(false);
  const [removingDiscount, setRemovingDiscount] = useState(false);
  
  // Extract quote data and check for discount
  const quote = pkg.quote as any;
  const hasDiscount = quote?.finalTotalPrice !== undefined && quote?.discountAmount > 0;
  
  // Calculate total from products_data admin tips + fees
  const productsData = (pkg.products_data as any[]) || [];
  const sumOfAdminTips = productsData.reduce((sum, product) => {
    const tip = parseFloat(product.adminAssignedTip || '0');
    return sum + tip;
  }, 0);
  
  const breakdown = getPriceBreakdown(
    sumOfAdminTips,
    pkg.delivery_method || 'pickup', 
    profile?.trust_level,
    pkg.package_destination
  );
  
  // Use finalTotalPrice if discount exists, otherwise use calculated total
  const totalAmount = hasDiscount ? parseFloat(quote.finalTotalPrice) : breakdown.totalPrice;
  const originalAmount = hasDiscount ? parseFloat(quote.originalTotalPrice) : totalAmount;

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

  // Protect modal from closing when file picker is active on Android
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isOpen) {
        console.log('📱 Tab hidden - locking modal');
        setCloseLocked(true);
      } else if (!document.hidden && isOpen) {
        // Small delay to allow file picker to complete
        setTimeout(() => {
          console.log('📱 Tab visible - unlocking modal');
          setCloseLocked(false);
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOpen]);

  const handleModalClose = (open: boolean) => {
    if (!open && !closeLocked) {
      console.log('🚪 Modal close allowed');
      onClose();
    } else if (!open && closeLocked) {
      console.log('🔒 Modal close blocked - file picker active');
    }
  };

  const handlePickerOpen = () => {
    console.log('📂 File picker opened - locking modal');
    setCloseLocked(true);
  };

  const handlePickerClose = () => {
    console.log('📂 File picker closed - unlocking modal');
    setTimeout(() => setCloseLocked(false), 300);
  };

  const removeDiscount = async () => {
    setRemovingDiscount(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const currentQuote = pkg.quote as any;
      
      // Reconstruct quote without discount fields
      const updatedQuote = {
        price: currentQuote.price,
        serviceFee: currentQuote.serviceFee,
        deliveryFee: currentQuote.deliveryFee,
        totalPrice: currentQuote.originalTotalPrice || currentQuote.totalPrice,
        message: currentQuote.message,
        adminAssignedTipAccepted: currentQuote.adminAssignedTipAccepted,
        completePrice: currentQuote.completePrice
      };
      
      const { error } = await supabase
        .from('packages')
        .update({ quote: updatedQuote })
        .eq('id', pkg.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedPkg = { ...pkg, quote: updatedQuote };
      setCurrentPkg(updatedPkg);
      onUploadComplete(updatedPkg);
      
      toast({
        title: "Descuento removido",
        description: "El descuento ha sido desaplicado correctamente",
      });
    } catch (error) {
      console.error('Error removing discount:', error);
      toast({
        title: "Error",
        description: "No se pudo remover el descuento. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setRemovingDiscount(false);
    }
  };

  // Can remove discount only if quote was accepted but payment not yet approved
  const canRemoveDiscount = hasDiscount && (
    pkg.status === 'quote_accepted' || 
    pkg.status === 'payment_pending' ||
    pkg.status === 'payment_pending_approval'
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (closeLocked) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (closeLocked) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (closeLocked) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if (closeLocked) e.preventDefault();
        }}
        onOpenAutoFocus={(e) => {
          if (closeLocked) e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          if (closeLocked) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información de Pago
          </DialogTitle>
          <DialogDescription>
            Completa el pago bancario y sube tu comprobante para continuar con tu pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Amount */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monto a Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              {hasDiscount ? (
                <>
                  <div className="text-lg text-muted-foreground line-through">
                    Q{originalAmount.toFixed(2)}
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    Q{totalAmount.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        🎉 Descuento aplicado: {quote.discountCode}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        (-Q{parseFloat(quote.discountAmount).toFixed(2)})
                      </span>
                    </div>
                    {canRemoveDiscount && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={removeDiscount}
                        disabled={removingDiscount}
                        className="h-auto p-1 hover:bg-green-100 dark:hover:bg-green-900"
                      >
                        <X className="h-4 w-4 text-green-700 dark:text-green-300" />
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-3xl font-bold text-primary">
                  Q{totalAmount.toFixed(2)}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
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
                <p>1. Realiza una transferencia bancaria por el monto exacto: <strong>Q{totalAmount.toFixed(2)}</strong>{hasDiscount && <span className="text-green-600 ml-1">(con descuento aplicado)</span>}</p>
                <p>2. Utiliza los datos bancarios de Favorón mostrados arriba</p>
                <p>3. Una vez completada la transferencia, sube tu comprobante de pago abajo</p>
                <p>4. Nuestro equipo verificará tu pago en las próximas 24 horas</p>
              </div>
            </CardContent>
          </Card>

          {/* Partial Delivery Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Información de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <PartialDeliveryInfo pkg={currentPkg} />
            </CardContent>
          </Card>

          {/* Upload Receipt Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Subir Comprobante de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              {showSuccessState ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                    <div>
                      <p className="font-medium text-success">¡Comprobante subido exitosamente!</p>
                      <p className="text-sm text-success/80">
                        Tu pago está siendo verificado por nuestro equipo. Te notificaremos cuando sea aprobado.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={onClose} variant="default">
                      Aceptar
                    </Button>
                  </div>
                </div>
              ) : (
                <PaymentReceiptUpload 
                  pkg={currentPkg} 
                  onUploadComplete={handleUploadComplete}
                  onPickerOpen={handlePickerOpen}
                  onPickerClose={handlePickerClose}
                />
              )}
            </CardContent>
          </Card>

          {/* Close Button - Only show when upload not complete */}
          {!showSuccessState && (
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
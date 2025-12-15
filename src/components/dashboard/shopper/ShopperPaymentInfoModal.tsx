import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, CreditCard, CheckCircle, X, Tag, Clock } from "lucide-react";
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
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  
  // Extract quote data and check for discount - use currentPkg for dynamic updates
  const quote = currentPkg.quote as any;
  const hasDiscount = quote?.finalTotalPrice !== undefined && quote?.discountAmount > 0;
  
  // Calculate total from products_data admin tips + fees
  const productsData = (currentPkg.products_data as any[]) || [];
  const sumOfAdminTips = productsData.reduce((sum, product) => {
    const tip = parseFloat(product.adminAssignedTip || '0');
    return sum + tip;
  }, 0);
  
  const breakdown = getPriceBreakdown(
    sumOfAdminTips,
    currentPkg.delivery_method || 'pickup', 
    profile?.trust_level,
    currentPkg.package_destination
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

  // Check if quote has expired
  const isQuoteExpired = !!(currentPkg.quote_expires_at && new Date(currentPkg.quote_expires_at) <= new Date());

  // Show success state if receipt was uploaded
  const showSuccessState = currentPkg.payment_receipt && currentPkg.status === 'payment_pending_approval';

  // Sync currentPkg with pkg prop when it changes
  useEffect(() => {
    setCurrentPkg(pkg);
  }, [pkg]);

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
      const currentQuote = currentPkg.quote as any;
      
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
        .eq('id', currentPkg.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedPkg = { ...currentPkg, quote: updatedQuote };
      setCurrentPkg(updatedPkg);
      
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

  const applyDiscount = async () => {
    if (!discountCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Por favor ingresa un código de descuento",
        variant: "destructive",
      });
      return;
    }

    setApplyingDiscount(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const currentQuote = currentPkg.quote as any;
      const orderAmount = breakdown.totalPrice;

      // Validate discount code
      const { data: validationResult, error: rpcError } = await supabase.rpc('validate_discount_code', {
        _code: discountCode.trim().toUpperCase(),
        _order_amount: orderAmount,
        _user_id: currentPkg.user_id
      });

      if (rpcError) throw rpcError;

      const result = validationResult as any;

      if (!result || !result.valid) {
        toast({
          title: "Código inválido",
          description: result?.error || "El código de descuento no es válido",
          variant: "destructive",
        });
        return;
      }

      // Apply discount
      const discountAmount = result.calculatedDiscount;
      const finalTotal = orderAmount - discountAmount;

      const updatedQuote = {
        ...currentQuote,
        discountCode: discountCode.trim().toUpperCase(),
        discountCodeId: result.discountCodeId,
        discountAmount: discountAmount,
        originalTotalPrice: orderAmount,
        finalTotalPrice: finalTotal,
        totalPrice: finalTotal
      };

      const { error: updateError } = await supabase
        .from('packages')
        .update({ quote: updatedQuote })
        .eq('id', currentPkg.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedPkg = { ...currentPkg, quote: updatedQuote };
      setCurrentPkg(updatedPkg);
      setDiscountCode('');

      toast({
        title: "¡Descuento aplicado!",
        description: `Has ahorrado Q${discountAmount.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Error applying discount:', error);
      toast({
        title: "Error",
        description: "No se pudo aplicar el descuento. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setApplyingDiscount(false);
    }
  };

  // Can remove discount only if quote was accepted but payment not yet approved
  const canRemoveDiscount = hasDiscount && (
    currentPkg.status === 'quote_accepted' || 
    currentPkg.status === 'payment_pending' ||
    currentPkg.status === 'payment_pending_approval'
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

        {isQuoteExpired ? (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-destructive">Cotización Expirada</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Esta cotización ha expirado. Por favor cierra este modal y solicita una nueva cotización.
              </p>
              <Button variant="outline" className="mt-4" onClick={onClose}>
                Cerrar
              </Button>
            </CardContent>
          </Card>
        ) : (
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
                        className="text-xs text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                      >
                        Cancelar descuento
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-primary">
                    Q{totalAmount.toFixed(2)}
                  </div>
                  
                  {/* Discount code input */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">¿Tienes un código de descuento?</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ingresa el código"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyDiscount();
                          }
                        }}
                        disabled={applyingDiscount}
                        className="flex-1"
                      />
                      <Button
                        onClick={applyDiscount}
                        disabled={applyingDiscount || !discountCode.trim()}
                        size="sm"
                      >
                        {applyingDiscount ? 'Aplicando...' : 'Aplicar'}
                      </Button>
                    </div>
                  </div>
                </>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
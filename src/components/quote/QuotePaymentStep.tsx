import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, CreditCard, CheckCircle, Tag, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavoronBankingInfo } from "@/hooks";
import { getQuoteValues } from "@/lib/quoteHelpers";
import PaymentReceiptUpload from "@/components/dashboard/shopper/PaymentReceiptUpload";
import PaymentMethodSelector, { PaymentMethod } from "@/components/payment/PaymentMethodSelector";
import RecurrenteCheckout from "@/components/payment/RecurrenteCheckout";
import ReferralCreditToggle from "@/components/payment/ReferralCreditToggle";
import { Package } from "@/types";
import { PartialDeliveryInfo } from "@/components/dashboard/PartialDeliveryInfo";
import { supabase } from "@/integrations/supabase/client";

interface QuotePaymentStepProps {
  pkg: Package;
  onPaymentComplete: (updatedPkg: Package) => void;
  onClose: () => void;
}

export default function QuotePaymentStep({ 
  pkg, 
  onPaymentComplete,
  onClose 
}: QuotePaymentStepProps) {
  const { toast } = useToast();
  const { account: bankAccount, loading: bankLoading } = useFavoronBankingInfo(pkg.id);
  const [currentPkg, setCurrentPkg] = useState(pkg);
  const [closeLocked, setCloseLocked] = useState(false);
  const [removingDiscount, setRemovingDiscount] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [referralCreditEnabled, setReferralCreditEnabled] = useState(() => !!(pkg.quote as any)?.referralCreditApplied);
  const [referralCreditAmount, setReferralCreditAmount] = useState(() => (pkg.quote as any)?.referralCreditAmount || 0);
  const [currentStep, setCurrentStep] = useState<'payment-selection' | 'card-checkout'>('payment-selection');
  
  // Extract quote data
  const quote = currentPkg.quote as any;
  const hasDiscount = quote?.finalTotalPrice !== undefined && quote?.discountAmount > 0;
  
  // Calculate active/cancelled products
  const productsData = (currentPkg.products_data as any[]) || [];
  const activeProducts = productsData.filter(
    (product) => product.cancelled !== true && product.cancelled !== 'true'
  );
  const cancelledProducts = productsData.filter(
    (product) => product.cancelled === true || product.cancelled === 'true'
  );
  
  const quoteValues = getQuoteValues(quote);
  
  const baseTotalAmount = hasDiscount 
    ? quoteValues.finalTotalPrice 
    : quoteValues.totalPrice;
  const totalAmount = referralCreditEnabled 
    ? Math.max(0, baseTotalAmount - referralCreditAmount)
    : baseTotalAmount;
  const originalAmount = hasDiscount 
    ? (parseFloat(quote.originalTotalPrice) || quoteValues.totalPrice)
    : quoteValues.totalPrice;

  const handleReferralCreditToggle = async (enabled: boolean, amount: number) => {
    setReferralCreditEnabled(enabled);
    setReferralCreditAmount(amount);
    
    // Save referral credit state in quote JSON
    const currentQuote = currentPkg.quote as any;
    const updatedQuote = {
      ...currentQuote,
      referralCreditApplied: enabled,
      referralCreditAmount: enabled ? amount : 0,
    };
    
    try {
      await supabase
        .from('packages')
        .update({ quote: updatedQuote })
        .eq('id', currentPkg.id);
      setCurrentPkg({ ...currentPkg, quote: updatedQuote });
    } catch (err) {
      console.error('Error saving referral credit:', err);
    }
  };

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
    onPaymentComplete(updatedPkg);
  };

  const showSuccessState = currentPkg.payment_receipt && currentPkg.status === 'payment_pending_approval';

  const handlePickerOpen = () => {
    setCloseLocked(true);
  };

  const handlePickerClose = () => {
    setTimeout(() => setCloseLocked(false), 300);
  };

  const removeDiscount = async () => {
    setRemovingDiscount(true);
    try {
      const currentQuote = currentPkg.quote as any;
      
      const updatedQuote = {
        price: currentQuote.price,
        serviceFee: currentQuote.serviceFee,
        deliveryFee: currentQuote.deliveryFee,
        totalPrice: currentQuote.originalTotalPrice || currentQuote.totalPrice,
        message: currentQuote.message,
        adminAssignedTipAccepted: currentQuote.adminAssignedTipAccepted
      };
      
      const { error } = await supabase
        .from('packages')
        .update({ quote: updatedQuote })
        .eq('id', currentPkg.id);
      
      if (error) throw error;
      
      setCurrentPkg({ ...currentPkg, quote: updatedQuote });
      
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
      const currentQuote = currentPkg.quote as any;
      const orderAmount = quoteValues.totalPrice;

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

      setCurrentPkg({ ...currentPkg, quote: updatedQuote });
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

  const canRemoveDiscount = hasDiscount && (
    currentPkg.status === 'quote_accepted' || 
    currentPkg.status === 'payment_pending' ||
    currentPkg.status === 'payment_pending_approval'
  );

  // Card checkout step
  if (currentStep === 'card-checkout') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentStep('payment-selection')} 
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Pago seguro</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Pago con Tarjeta</p>
              <p className="text-sm text-muted-foreground">
                {activeProducts.length} producto{activeProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className="text-2xl font-bold text-primary">Q{totalAmount.toFixed(2)}</span>
        </div>

        <RecurrenteCheckout
          pkg={currentPkg}
          amount={totalAmount}
          isEmbedded={true}
          onBack={() => setCurrentStep('payment-selection')}
          onSuccess={async () => {
            // Mark referral credit as used on card payment success
            if (referralCreditEnabled && referralCreditAmount > 0) {
              try {
                await supabase.rpc('mark_referral_credit_used', {
                  p_user_id: currentPkg.user_id,
                  p_amount: referralCreditAmount,
                  p_package_id: currentPkg.id,
                });
              } catch (err) {
                console.error('⚠️ Error marking referral credit:', err);
              }
            }
            handleUploadComplete({
              ...currentPkg,
              status: 'payment_pending_approval',
              payment_method: 'card'
            } as any);
          }}
          onCancel={() => {
            setCurrentStep('payment-selection');
            setPaymentMethod('bank_transfer');
          }}
          onError={(error) => {
            toast({
              title: 'Error en el pago',
              description: error,
              variant: 'destructive'
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          
          {/* Referral Credit Toggle */}
          <div className="mt-3">
            <ReferralCreditToggle
              enabled={referralCreditEnabled}
              onToggle={handleReferralCreditToggle}
              maxApplicable={baseTotalAmount}
              disabled={showSuccessState}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Por el paquete: {activeProducts.length} producto{activeProducts.length !== 1 ? 's' : ''}: {activeProducts.map(p => p.itemDescription || p.item_description).join(', ')}
            {cancelledProducts.length > 0 && (
              <span className="text-destructive ml-1">
                ({cancelledProducts.length} cancelado{cancelledProducts.length !== 1 ? 's' : ''})
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Payment Method Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Método de Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onMethodChange={setPaymentMethod}
            disabled={showSuccessState}
          />
        </CardContent>
      </Card>

      {/* Conditional Payment Section */}
      {paymentMethod === 'bank_transfer' ? (
        <>
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

          {/* Upload Receipt Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Subir Comprobante de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              {showSuccessState ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">¡Comprobante subido exitosamente!</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
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
        </>
      ) : (
        /* Card Payment */
        <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Pago con Tarjeta</p>
              <p className="text-sm text-muted-foreground">
                Continúa para ingresar los datos de tu tarjeta de forma segura
              </p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monto a pagar:</span>
              <span className="text-lg font-bold text-primary">Q{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            onClick={() => setCurrentStep('card-checkout')}
            className="w-full"
            size="lg"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Pagar Q{totalAmount.toFixed(2)} con tarjeta
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            🔒 Pago procesado de forma segura por Recurrente
          </p>
        </div>
      )}

      {/* Partial Delivery Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Información de Entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <PartialDeliveryInfo pkg={currentPkg} />
        </CardContent>
      </Card>

      {/* Close Button */}
      {!showSuccessState && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      )}
    </div>
  );
}

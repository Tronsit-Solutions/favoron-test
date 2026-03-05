import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, Save, Loader2, Package, Tag, X } from 'lucide-react';
import { useQuoteManagement } from '@/hooks/useQuoteManagement';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformFeesContext } from '@/contexts/PlatformFeesContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ProductTipAssignmentModal from './ProductTipAssignmentModal';

interface QuoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: {
    id: string;
    quote: any;
    matched_trip_id?: string | null;
    profiles?: { trust_level?: string };
    delivery_method?: string;
    confirmed_delivery_address?: { cityArea?: string };
    package_destination?: string;
    products_data?: any[];
    user_id?: string;
  };
  tripUserId?: string | null;
  onSuccess?: () => void;
}

const QuoteEditModal = ({
  isOpen,
  onClose,
  packageData,
  tripUserId,
  onSuccess
}: QuoteEditModalProps) => {
  const { user } = useAuth();
  const { updateQuoteManually, isUpdating } = useQuoteManagement();
  const { getServiceFeeRate } = usePlatformFeesContext();
  const { toast } = useToast();
  const [showProductTipModal, setShowProductTipModal] = useState(false);

  // Get products data
  const productsData = packageData?.products_data || [];
  const hasMultipleProducts = productsData.length > 1;

  // Parse current values from quote
  const currentQuote = packageData?.quote || {};
  const currentTip = parseFloat(currentQuote.price || '0');
  const currentServiceFee = parseFloat(currentQuote.serviceFee || '0');
  const currentDeliveryFee = parseFloat(currentQuote.deliveryFee || '0');
  const trustLevel = packageData?.profiles?.trust_level || 'basic';

  // Form state
  const [tip, setTip] = useState<string>(currentTip.toFixed(2));
  const [serviceFee, setServiceFee] = useState<string>(currentServiceFee.toFixed(2));
  const [deliveryFee, setDeliveryFee] = useState<string>(currentDeliveryFee.toFixed(2));

  // Discount state
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    codeId: string;
    amount: number;
    type: string;
    value: number;
  } | null>(currentQuote?.discountCode ? {
    code: currentQuote.discountCode,
    codeId: currentQuote.discountCodeId || '',
    amount: parseFloat(currentQuote.discountAmount || '0'),
    type: '',
    value: 0,
  } : null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTip(currentTip.toFixed(2));
      setServiceFee(currentServiceFee.toFixed(2));
      setDeliveryFee(currentDeliveryFee.toFixed(2));
      setDiscountCodeInput('');
      setAppliedDiscount(currentQuote?.discountCode ? {
        code: currentQuote.discountCode,
        codeId: currentQuote.discountCodeId || '',
        amount: parseFloat(currentQuote.discountAmount || '0'),
        type: '',
        value: 0,
      } : null);
    }
  }, [isOpen, currentTip, currentServiceFee, currentDeliveryFee]);

  // Calculate expected service fee based on trust level (using DB rates)
  const tipValue = parseFloat(tip) || 0;
  const serviceFeeValue = parseFloat(serviceFee) || 0;
  const deliveryFeeValue = parseFloat(deliveryFee) || 0;
  const expectedRate = getServiceFeeRate(trustLevel);
  const expectedServiceFee = tipValue * expectedRate;
  const isServiceFeeNonStandard = Math.abs(serviceFeeValue - expectedServiceFee) > 0.01;

  // Calculate total
  const totalPrice = tipValue + serviceFeeValue + deliveryFeeValue;
  const discountAmountApplied = appliedDiscount?.amount || 0;
  const finalTotal = totalPrice - discountAmountApplied;

  // Validate discount code
  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) return;
    setValidatingDiscount(true);
    try {
      const favoronSubtotal = tipValue + serviceFeeValue;
      const { data: result, error } = await supabase.rpc('validate_discount_code', {
        _code: discountCodeInput.trim().toUpperCase(),
        _order_amount: favoronSubtotal,
        _user_id: packageData.user_id || '',
      });

      if (error) throw error;

      const validation = result as any;
      if (!validation?.valid) {
        toast({
          title: "Código inválido",
          description: validation?.message || "El código no es válido",
          variant: "destructive",
        });
        return;
      }

      setAppliedDiscount({
        code: discountCodeInput.trim().toUpperCase(),
        codeId: validation.discountCodeId,
        amount: validation.calculatedDiscount,
        type: validation.discountType,
        value: validation.discountValue,
      });
      setDiscountCodeInput('');
      toast({
        title: "Descuento aplicado",
        description: `Descuento de Q${validation.calculatedDiscount.toFixed(2)} aplicado`,
      });
    } catch (err: any) {
      toast({
        title: "Error al validar código",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const result = await updateQuoteManually({
      packageId: packageData.id,
      newTip: tipValue,
      newServiceFee: serviceFeeValue,
      newDeliveryFee: deliveryFeeValue,
      tripId: packageData.matched_trip_id || null,
      travelerId: tripUserId || null,
      adminId: user.id,
      previousQuote: currentQuote,
      discountCode: appliedDiscount?.code,
      discountCodeId: appliedDiscount?.codeId,
      discountAmount: appliedDiscount?.amount,
      shopperUserId: packageData.user_id,
    });

    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  const handleProductTipsSaved = () => {
    setShowProductTipModal(false);
    onSuccess?.();
    onClose();
  };

  // For multiple products, show a simplified view with button to edit per-product
  if (hasMultipleProducts) {
    return (
      <>
        <Dialog open={isOpen && !showProductTipModal} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Editar Tips por Producto
              </DialogTitle>
              <DialogDescription>
                Este paquete tiene {productsData.length} productos. Debes editar el tip de cada uno individualmente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tip Total Actual:</span>
                  <Badge variant="outline" className="font-mono">Q{currentTip.toFixed(2)}</Badge>
                </div>
              <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Service Fee ({Math.round(expectedRate * 100)}%):</span>
                  <Badge variant="outline" className="font-mono">Q{currentServiceFee.toFixed(2)}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Delivery Fee:</span>
                  <Badge variant="outline" className="font-mono">Q{currentDeliveryFee.toFixed(2)}</Badge>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="font-bold text-primary">Q{(currentTip + currentServiceFee + currentDeliveryFee).toFixed(2)}</span>
                </div>
              </div>

              {/* Products Preview */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Productos:</p>
                {productsData.map((product: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-background border rounded-md p-2">
                    <span className="truncate flex-1">{product.itemDescription || `Producto ${idx + 1}`}</span>
                    <Badge variant="secondary" className="ml-2 font-mono">
                      Tip: Q{parseFloat(product.adminAssignedTip || 0).toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => setShowProductTipModal(true)}>
                <Package className="h-4 w-4 mr-2" />
                Editar Tips por Producto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProductTipAssignmentModal
          isOpen={showProductTipModal}
          onClose={() => setShowProductTipModal(false)}
          onSave={handleProductTipsSaved}
          products={productsData}
          packageId={packageData.id}
          tripId={packageData.matched_trip_id}
          travelerId={tripUserId}
          trustLevel={trustLevel}
        />
      </>
    );
  }

  // Single product: allow direct editing
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Editar Cotización
          </DialogTitle>
          <DialogDescription>
            Modifica el tip y service fee manualmente. Los cambios se propagarán al acumulador de pagos del viajero.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Trust Level Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Nivel del Shopper:</span>
            <Badge variant={trustLevel === 'prime' ? 'default' : 'secondary'}>
              {trustLevel === 'prime' ? `⭐ Prime (${Math.round(expectedRate * 100)}%)` : `Estándar (${Math.round(expectedRate * 100)}%)`}
            </Badge>
          </div>

          {/* Tip Input */}
          <div className="space-y-2">
            <Label htmlFor="tip">Tip del Viajero (Q)</Label>
            <Input
              id="tip"
              type="number"
              step="0.01"
              min="0"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Service Fee Input */}
          <div className="space-y-2">
            <Label htmlFor="serviceFee">Service Fee (Q)</Label>
            <Input
              id="serviceFee"
              type="number"
              step="0.01"
              min="0"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              placeholder="0.00"
            />
            
            {/* Warning if service fee doesn't match expected */}
            {isServiceFeeNonStandard && tipValue > 0 && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-amber-700">
                    El {Math.round(expectedRate * 100)}% del tip sería Q{expectedServiceFee.toFixed(2)}. 
                    Estás usando Q{serviceFeeValue.toFixed(2)}.
                  </p>
                  <Button 
                    type="button" 
                    variant="link" 
                    size="sm"
                    onClick={() => setServiceFee(expectedServiceFee.toFixed(2))}
                    className="text-amber-700 p-0 h-auto text-xs underline mt-1"
                  >
                    Usar tarifa correcta (Q{expectedServiceFee.toFixed(2)})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Fee Input */}
          <div className="space-y-2">
            <Label htmlFor="deliveryFee">Delivery Fee (Q)</Label>
            <Input
              id="deliveryFee"
              type="number"
              step="0.01"
              min="0"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Discount Code Section */}
          <div className="space-y-2 border-t pt-4">
            <Label className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Código de Descuento
            </Label>
            {appliedDiscount ? (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {appliedDiscount.code}
                  </Badge>
                  <span className="text-sm text-green-700 font-medium">
                    -Q{appliedDiscount.amount.toFixed(2)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveDiscount}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: DESCUENTO10"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyDiscount}
                  disabled={validatingDiscount || !discountCodeInput.trim()}
                >
                  {validatingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                </Button>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t pt-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal:</span>
              <span className="text-sm">Q{totalPrice.toFixed(2)}</span>
            </div>
            {discountAmountApplied > 0 && (
              <div className="flex items-center justify-between text-green-700">
                <span className="text-sm">Descuento ({appliedDiscount?.code}):</span>
                <span className="text-sm font-medium">-Q{discountAmountApplied.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total a Pagar:</span>
              <span className="text-lg font-bold text-primary">
                Q{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Changes Summary */}
          {(tipValue !== currentTip || serviceFeeValue !== currentServiceFee || deliveryFeeValue !== currentDeliveryFee) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
              <p className="font-medium text-blue-800 mb-1">Cambios:</p>
              <ul className="text-blue-700 space-y-0.5">
                {tipValue !== currentTip && (
                  <li>• Tip: Q{currentTip.toFixed(2)} → Q{tipValue.toFixed(2)}</li>
                )}
                {serviceFeeValue !== currentServiceFee && (
                  <li>• Service Fee: Q{currentServiceFee.toFixed(2)} → Q{serviceFeeValue.toFixed(2)}</li>
                )}
                {deliveryFeeValue !== currentDeliveryFee && (
                  <li>• Delivery Fee: Q{currentDeliveryFee.toFixed(2)} → Q{deliveryFeeValue.toFixed(2)}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteEditModal;

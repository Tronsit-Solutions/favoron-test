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
import { AlertTriangle, DollarSign, Save, Loader2, Package } from 'lucide-react';
import { useQuoteManagement } from '@/hooks/useQuoteManagement';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformFeesContext } from '@/contexts/PlatformFeesContext';
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTip(currentTip.toFixed(2));
      setServiceFee(currentServiceFee.toFixed(2));
    }
  }, [isOpen, currentTip, currentServiceFee]);

  // Calculate expected service fee based on trust level (using DB rates)
  const tipValue = parseFloat(tip) || 0;
  const serviceFeeValue = parseFloat(serviceFee) || 0;
  const expectedRate = getServiceFeeRate(trustLevel);
  const expectedServiceFee = tipValue * expectedRate;
  const isServiceFeeNonStandard = Math.abs(serviceFeeValue - expectedServiceFee) > 0.01;

  // Calculate total
  const totalPrice = tipValue + serviceFeeValue + currentDeliveryFee;

  const handleSave = async () => {
    if (!user?.id) return;

    const result = await updateQuoteManually({
      packageId: packageData.id,
      newTip: tipValue,
      newServiceFee: serviceFeeValue,
      currentDeliveryFee: currentDeliveryFee,
      tripId: packageData.matched_trip_id || null,
      travelerId: tripUserId || null,
      adminId: user.id,
      previousQuote: currentQuote
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
                <p className="text-xs text-amber-700">
                  El {expectedRate * 100}% del tip sería Q{expectedServiceFee.toFixed(2)}. 
                  Estás usando Q{serviceFeeValue.toFixed(2)}.
                </p>
              </div>
            )}
          </div>

          {/* Delivery Fee (Read Only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Delivery Fee (solo lectura)</Label>
            <div className="flex items-center h-10 px-3 bg-muted rounded-md border">
              <span className="text-sm">Q{currentDeliveryFee.toFixed(2)}</span>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total a Pagar:</span>
              <span className="text-lg font-bold text-primary">
                Q{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Changes Summary */}
          {(tipValue !== currentTip || serviceFeeValue !== currentServiceFee) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
              <p className="font-medium text-blue-800 mb-1">Cambios:</p>
              <ul className="text-blue-700 space-y-0.5">
                {tipValue !== currentTip && (
                  <li>• Tip: Q{currentTip.toFixed(2)} → Q{tipValue.toFixed(2)}</li>
                )}
                {serviceFeeValue !== currentServiceFee && (
                  <li>• Service Fee: Q{currentServiceFee.toFixed(2)} → Q{serviceFeeValue.toFixed(2)}</li>
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

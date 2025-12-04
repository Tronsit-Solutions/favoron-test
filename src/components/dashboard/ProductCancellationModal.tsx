import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Banknote, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRefundOrders } from '@/hooks/useRefundOrders';
import { getRefundBreakdown, CANCELLATION_REASONS, CancellationReason } from '@/lib/refundCalculations';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface ProductData {
  itemDescription?: string;
  estimatedPrice?: string | number;
  quantity?: string | number;
  adminAssignedTip?: number;
  cancelled?: boolean;
  itemLink?: string;
}

interface ProductCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductData;
  productIndex: number;
  packageId: string;
  quote: any;
  allProducts: ProductData[];
  onCancellationComplete: () => void;
}

const ProductCancellationModal = ({
  isOpen,
  onClose,
  product,
  productIndex,
  packageId,
  quote,
  allProducts,
  onCancellationComplete,
}: ProductCancellationModalProps) => {
  const [reason, setReason] = useState<CancellationReason>('product_unavailable');
  const [bankName, setBankName] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountType, setBankAccountType] = useState('monetary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBankInfo, setLoadingBankInfo] = useState(true);

  const { createRefundOrder } = useRefundOrders();

  // Calculate refund breakdown
  const refundBreakdown = getRefundBreakdown(product, quote, allProducts);

  // Load user's existing bank info
  useEffect(() => {
    const loadBankInfo = async () => {
      try {
        setLoadingBankInfo(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: financialData } = await supabase
          .from('user_financial_data')
          .select('bank_name, bank_account_holder, bank_account_number, bank_account_type')
          .eq('user_id', user.id)
          .single();

        if (financialData) {
          setBankName(financialData.bank_name || '');
          setBankAccountHolder(financialData.bank_account_holder || '');
          setBankAccountNumber(financialData.bank_account_number || '');
          setBankAccountType(financialData.bank_account_type || 'monetary');
        }
      } catch (error) {
        console.error('Error loading bank info:', error);
      } finally {
        setLoadingBankInfo(false);
      }
    };

    if (isOpen) {
      loadBankInfo();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Validate bank info
    if (!bankName.trim() || !bankAccountHolder.trim() || !bankAccountNumber.trim()) {
      toast.error('Por favor completa todos los datos bancarios');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // 1. Create refund order
      const refundOrder = await createRefundOrder({
        packageId,
        shopperId: user.id,
        bankName: bankName.trim(),
        bankAccountHolder: bankAccountHolder.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankAccountType,
        amount: refundBreakdown.totalRefund,
        reason,
        cancelledProducts: [{
          index: productIndex,
          description: product.itemDescription,
          tip: refundBreakdown.productTip,
          serviceFee: refundBreakdown.proportionalServiceFee,
          totalRefund: refundBreakdown.totalRefund,
          cancelledAt: new Date().toISOString()
        }]
      });

      if (!refundOrder) throw new Error('Failed to create refund order');

      // 2. Update product as cancelled in products_data
      const { data: packageData, error: fetchError } = await supabase
        .from('packages')
        .select('products_data, quote')
        .eq('id', packageId)
        .single();

      if (fetchError) throw fetchError;

      const updatedProducts = [...(packageData.products_data as any[] || [])];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        cancelled: true,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        refundAmount: refundBreakdown.totalRefund,
        refundOrderId: refundOrder.id
      };

      // 3. Update quote with cancellation info
      const currentQuote = packageData.quote as any || {};
      const updatedQuote = {
        ...currentQuote,
        cancellations: [
          ...(currentQuote.cancellations || []),
          {
            productIndex,
            refundAmount: refundBreakdown.totalRefund,
            cancelledAt: new Date().toISOString(),
            reason
          }
        ],
        adjustedTotalPrice: (currentQuote.totalPrice || 0) - refundBreakdown.totalRefund
      };

      // 4. Save updates
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          products_data: updatedProducts,
          quote: updatedQuote
        })
        .eq('id', packageId);

      if (updateError) throw updateError;

      // 5. Save bank info for future use
      const { data: existingFinancial } = await supabase
        .from('user_financial_data')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingFinancial) {
        await supabase
          .from('user_financial_data')
          .update({
            bank_name: bankName.trim(),
            bank_account_holder: bankAccountHolder.trim(),
            bank_account_number: bankAccountNumber.trim(),
            bank_account_type: bankAccountType
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_financial_data')
          .insert({
            user_id: user.id,
            bank_name: bankName.trim(),
            bank_account_holder: bankAccountHolder.trim(),
            bank_account_number: bankAccountNumber.trim(),
            bank_account_type: bankAccountType
          });
      }

      toast.success('Producto cancelado. Tu solicitud de reembolso ha sido creada.');
      onCancellationComplete();
      onClose();
    } catch (error) {
      console.error('Error cancelling product:', error);
      toast.error('Error al cancelar el producto. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancelar Producto
          </DialogTitle>
          <DialogDescription>
            Esta acción creará una solicitud de reembolso que será procesada por el equipo de Favoron.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{product.itemDescription || `Producto ${productIndex + 1}`}</p>
                <p className="text-xs text-muted-foreground">
                  Cantidad: {product.quantity || 1}
                </p>
              </div>
            </div>
          </div>

          {/* Refund breakdown */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Cálculo de Reembolso
            </h4>
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo del producto:</span>
                <span>{formatCurrency(refundBreakdown.productTip)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee Favoron proporcional:</span>
                <span>{formatCurrency(refundBreakdown.proportionalServiceFee)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-green-700">
                <span>Total a reembolsar:</span>
                <span>{formatCurrency(refundBreakdown.totalRefund)}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Razón de cancelación</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as CancellationReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Bank info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Datos bancarios para el reembolso</h4>
            
            {loadingBankInfo ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej: Banrural, BAM, BI"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountHolder">Titular de la cuenta</Label>
                  <Input
                    id="bankAccountHolder"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Número de cuenta</Label>
                  <Input
                    id="bankAccountNumber"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Número de cuenta"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountType">Tipo de cuenta</Label>
                  <Select value={bankAccountType} onValueChange={setBankAccountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monetary">Monetaria</SelectItem>
                      <SelectItem value="savings">Ahorro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              El reembolso será procesado en 3-5 días hábiles después de ser aprobado por nuestro equipo.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={isSubmitting || loadingBankInfo}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar Cancelación'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCancellationModal;

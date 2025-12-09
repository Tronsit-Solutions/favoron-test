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
import { AlertTriangle, Banknote, Package, Loader2, Crown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRefundOrders } from '@/hooks/useRefundOrders';
import { getRefundBreakdown, CANCELLATION_REASONS, CancellationReason, DEFAULT_CANCELLATION_PENALTY } from '@/lib/refundCalculations';
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

interface AdminProductCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductData;
  productIndex: number;
  packageId: string;
  shopperId: string;
  quote: any;
  allProducts: ProductData[];
  onCancellationComplete: () => void;
}

const AdminProductCancellationModal = ({
  isOpen,
  onClose,
  product,
  productIndex,
  packageId,
  shopperId,
  quote,
  allProducts,
  onCancellationComplete,
}: AdminProductCancellationModalProps) => {
  const [reason, setReason] = useState<CancellationReason>('product_unavailable');
  const [bankName, setBankName] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountType, setBankAccountType] = useState('monetary');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isPrimeUser, setIsPrimeUser] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(DEFAULT_CANCELLATION_PENALTY);
  const [shopperName, setShopperName] = useState('');

  const { createRefundOrder } = useRefundOrders();

  // Calculate refund breakdown with penalty info
  const refundBreakdown = getRefundBreakdown(product, quote, allProducts, {
    penaltyAmount,
    isPrimeUser
  });

  // Load shopper's bank info, Prime status, and penalty amount
  useEffect(() => {
    const loadData = async () => {
      if (!shopperId) return;
      
      try {
        setLoadingData(true);

        // Load in parallel: shopper bank info, shopper profile, company info
        const [financialResult, profileResult, companyResult] = await Promise.all([
          supabase
            .from('user_financial_data')
            .select('bank_name, bank_account_holder, bank_account_number, bank_account_type')
            .eq('user_id', shopperId)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('trust_level, first_name, last_name')
            .eq('id', shopperId)
            .single(),
          supabase
            .from('favoron_company_information')
            .select('cancellation_penalty_amount, prime_penalty_exempt')
            .eq('is_active', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        // Set bank info from shopper
        if (financialResult.data) {
          setBankName(financialResult.data.bank_name || '');
          setBankAccountHolder(financialResult.data.bank_account_holder || '');
          setBankAccountNumber(financialResult.data.bank_account_number || '');
          setBankAccountType(financialResult.data.bank_account_type || 'monetary');
        }

        // Set shopper's Prime status - only exempt if user is Prime AND system allows Prime exemption
        const isUserPrime = profileResult.data?.trust_level === 'prime';
        const primePenaltyExempt = companyResult.data?.prime_penalty_exempt !== false; // default true
        setIsPrimeUser(isUserPrime && primePenaltyExempt);
        
        if (profileResult.data) {
          setShopperName(`${profileResult.data.first_name || ''} ${profileResult.data.last_name || ''}`.trim());
        }

        // Set penalty amount
        if (companyResult.data && companyResult.data.cancellation_penalty_amount != null) {
          setPenaltyAmount(companyResult.data.cancellation_penalty_amount);
        }
      } catch (error) {
        console.error('Error loading shopper data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, shopperId]);

  const handleSubmit = async () => {
    // Validate bank info
    if (!bankName.trim() || !bankAccountHolder.trim() || !bankAccountNumber.trim()) {
      toast.error('Por favor completa todos los datos bancarios del shopper');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create refund order on behalf of shopper
      const refundOrder = await createRefundOrder({
        packageId,
        shopperId,
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
          grossRefund: refundBreakdown.grossRefund,
          penaltyApplied: refundBreakdown.cancellationPenalty,
          isPrimeExempt: refundBreakdown.isPrimeExempt,
          totalRefund: refundBreakdown.totalRefund,
          cancelledAt: new Date().toISOString(),
          cancelledByAdmin: true
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
        refundOrderId: refundOrder.id,
        penaltyApplied: refundBreakdown.cancellationPenalty,
        isPrimeExempt: refundBreakdown.isPrimeExempt,
        cancelledByAdmin: true
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
            penaltyApplied: refundBreakdown.cancellationPenalty,
            isPrimeExempt: refundBreakdown.isPrimeExempt,
            cancelledAt: new Date().toISOString(),
            reason,
            cancelledByAdmin: true
          }
        ],
        adjustedTotalPrice: (currentQuote.totalPrice || 0) - refundBreakdown.totalRefund
      };

      // 4. Check if ALL products are now cancelled
      const allProductsCancelled = updatedProducts.every((p: any) => p.cancelled === true);

      // 5. Build update payload
      const updatePayload: any = {
        products_data: updatedProducts,
        quote: updatedQuote
      };

      // If all products cancelled, mark package as cancelled
      if (allProductsCancelled) {
        updatePayload.status = 'cancelled';
      }

      const { error: updateError } = await supabase
        .from('packages')
        .update(updatePayload)
        .eq('id', packageId);

      if (updateError) throw updateError;

      if (allProductsCancelled) {
        toast.success(`Todos los productos cancelados. El pedido ha sido cancelado.`);
      } else {
        toast.success(`Producto cancelado. Reembolso de ${formatCurrency(refundBreakdown.totalRefund)} creado para ${shopperName || 'el shopper'}.`);
      }
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
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Cancelar Producto (Admin)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cancelación en nombre del shopper{shopperName ? `: ${shopperName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {/* Product info */}
          <div className="bg-muted p-2 rounded-lg">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{product.itemDescription || `Producto ${productIndex + 1}`}</p>
                <p className="text-xs text-muted-foreground">Cantidad: {product.quantity || 1}</p>
              </div>
            </div>
          </div>

          {/* Refund breakdown */}
          <div className="space-y-1">
            <h4 className="font-medium text-xs flex items-center gap-1">
              <Banknote className="h-3 w-3" />
              Cálculo de Reembolso para Shopper
            </h4>
            <div className="bg-green-50 border border-green-200 p-2 rounded-lg space-y-1 text-xs dark:bg-green-950/30 dark:border-green-800">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo del producto:</span>
                <span>{formatCurrency(refundBreakdown.productTip)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee Favoron:</span>
                <span>{formatCurrency(refundBreakdown.proportionalServiceFee)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(refundBreakdown.grossRefund)}</span>
              </div>
              
              {refundBreakdown.isPrimeExempt ? (
                <div className="flex justify-between text-purple-600">
                  <span className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Penalización (Prime exento):
                  </span>
                  <span>Q0.00</span>
                </div>
              ) : (
                <div className="flex justify-between text-destructive">
                  <span>Penalización:</span>
                  <span>-{formatCurrency(refundBreakdown.cancellationPenalty)}</span>
                </div>
              )}
              
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold text-green-700 dark:text-green-400">
                <span>Total a reembolsar:</span>
                <span>{formatCurrency(refundBreakdown.totalRefund)}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <Label htmlFor="reason" className="text-xs">Razón de cancelación</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as CancellationReason)}>
              <SelectTrigger className="h-9">
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
          <div className="space-y-2">
            <h4 className="font-medium text-xs">Datos bancarios del shopper para reembolso</h4>
            
            {loadingData ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="bankName" className="text-xs">Banco</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej: Banrural"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bankAccountType" className="text-xs">Tipo</Label>
                  <Select value={bankAccountType} onValueChange={setBankAccountType}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monetary">Monetaria</SelectItem>
                      <SelectItem value="savings">Ahorro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="bankAccountHolder" className="text-xs">Titular</Label>
                  <Input
                    id="bankAccountHolder"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Nombre completo"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="bankAccountNumber" className="text-xs">Número de cuenta</Label>
                  <Input
                    id="bankAccountNumber"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Número de cuenta"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <Alert className="py-2">
            <AlertTriangle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Se creará una orden de reembolso pendiente de aprobación en el panel de Pagos.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 flex-shrink-0 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            size="sm"
            onClick={handleSubmit} 
            disabled={isSubmitting || loadingData}
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

export default AdminProductCancellationModal;

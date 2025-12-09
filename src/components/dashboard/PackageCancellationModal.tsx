import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Ban, DollarSign, CreditCard, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRefundOrders } from '@/hooks/useRefundOrders';
import {
  calculatePackageRefund,
  getPackageRefundBreakdown,
  PACKAGE_CANCELLATION_REASONS,
  PackageCancellationReason,
  DEFAULT_CANCELLATION_PENALTY
} from '@/lib/refundCalculations';

interface QuoteData {
  price?: number;
  serviceFee?: number;
  deliveryFee?: number;
  totalPrice?: number;
  finalTotalPrice?: number;
}

interface ProductData {
  itemDescription?: string;
  estimatedPrice?: string | number;
  quantity?: string | number;
  adminAssignedTip?: number;
}

interface PackageCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  quote: QuoteData;
  products: ProductData[];
  onCancellationComplete?: () => void;
}

export const PackageCancellationModal: React.FC<PackageCancellationModalProps> = ({
  isOpen,
  onClose,
  packageId,
  quote,
  products,
  onCancellationComplete
}) => {
  const { toast } = useToast();
  const { createRefundOrder } = useRefundOrders();
  
  const [cancellationReason, setCancellationReason] = useState<PackageCancellationReason | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBankData, setIsLoadingBankData] = useState(true);
  const [isPrimeUser, setIsPrimeUser] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState(DEFAULT_CANCELLATION_PENALTY);
  
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    bank_account_type: 'Monetaria'
  });

  // Load bank details, Prime status, and penalty amount
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      setIsLoadingBankData(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load bank details
        const { data: financialData } = await supabase
          .from('user_financial_data')
          .select('bank_name, bank_account_number, bank_account_holder, bank_account_type')
          .eq('user_id', user.id)
          .single();

        if (financialData) {
          setBankDetails({
            bank_name: financialData.bank_name || '',
            bank_account_number: financialData.bank_account_number || '',
            bank_account_holder: financialData.bank_account_holder || '',
            bank_account_type: financialData.bank_account_type || 'Monetaria'
          });
        }

        // Check Prime status
        const { data: profile } = await supabase
          .from('profiles')
          .select('prime_expires_at')
          .eq('id', user.id)
          .single();

        if (profile?.prime_expires_at) {
          setIsPrimeUser(new Date(profile.prime_expires_at) > new Date());
        }

        // Load cancellation penalty
        const { data: companyInfo } = await supabase
          .from('favoron_company_information')
          .select('cancellation_penalty_amount')
          .eq('is_active', true)
          .single();

        if (companyInfo?.cancellation_penalty_amount) {
          setPenaltyAmount(companyInfo.cancellation_penalty_amount);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingBankData(false);
      }
    };

    loadData();
  }, [isOpen]);

  // Calculate refund breakdown
  const refundBreakdown = getPackageRefundBreakdown(quote, {
    penaltyAmount,
    isPrimeUser
  });

  const handleSubmit = async () => {
    if (!cancellationReason) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una razón para la cancelación',
        variant: 'destructive'
      });
      return;
    }

    if (!bankDetails.bank_name || !bankDetails.bank_account_number || !bankDetails.bank_account_holder) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los datos bancarios',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create refund order for the full package
      await createRefundOrder({
        packageId,
        shopperId: user.id,
        bankName: bankDetails.bank_name,
        bankAccountHolder: bankDetails.bank_account_holder,
        bankAccountNumber: bankDetails.bank_account_number,
        bankAccountType: bankDetails.bank_account_type,
        amount: refundBreakdown.totalRefund,
        reason: `Cancelación completa: ${PACKAGE_CANCELLATION_REASONS.find(r => r.value === cancellationReason)?.label || cancellationReason}`,
        cancelledProducts: products.map(p => ({
          itemDescription: p.itemDescription,
          estimatedPrice: p.estimatedPrice,
          quantity: p.quantity,
          adminAssignedTip: p.adminAssignedTip
        }))
      });

      // Update package status to cancelled
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          status: 'cancelled',
          rejection_reason: `Cancelado por shopper: ${PACKAGE_CANCELLATION_REASONS.find(r => r.value === cancellationReason)?.label || cancellationReason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', packageId);

      if (updateError) throw updateError;

      // Save/update bank details for future use
      const { data: existingFinancial } = await supabase
        .from('user_financial_data')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingFinancial) {
        await supabase
          .from('user_financial_data')
          .update({
            bank_name: bankDetails.bank_name,
            bank_account_number: bankDetails.bank_account_number,
            bank_account_holder: bankDetails.bank_account_holder,
            bank_account_type: bankDetails.bank_account_type,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_financial_data')
          .insert({
            user_id: user.id,
            bank_name: bankDetails.bank_name,
            bank_account_number: bankDetails.bank_account_number,
            bank_account_holder: bankDetails.bank_account_holder,
            bank_account_type: bankDetails.bank_account_type
          });
      }

      toast({
        title: 'Pedido cancelado',
        description: `Se ha generado una orden de reembolso por Q${refundBreakdown.totalRefund.toFixed(2)}`,
      });

      onCancellationComplete?.();
      onClose();
    } catch (error) {
      console.error('Error cancelling package:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el pedido. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Cancelar Pedido Completo
          </DialogTitle>
          <DialogDescription>
            Se generará una orden de reembolso que será procesada por el equipo de Favorón.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Products Summary */}
          <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">Productos a cancelar:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {products.map((p, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="truncate">{p.itemDescription || `Producto ${idx + 1}`}</span>
                  <span>x{p.quantity || 1}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Refund Breakdown */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Desglose del Reembolso
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tips viajero</span>
                <span>Q{refundBreakdown.totalTips.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comisión Favorón</span>
                <span>Q{refundBreakdown.serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery (no reembolsable)</span>
                <span className="line-through">Q{refundBreakdown.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-green-200 dark:border-green-800 my-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Q{refundBreakdown.grossRefund.toFixed(2)}</span>
                </div>
              </div>
              {refundBreakdown.isPrimeExempt ? (
                <div className="flex justify-between text-purple-600">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Prime: Sin penalización
                  </span>
                  <span>-Q0.00</span>
                </div>
              ) : (
                <div className="flex justify-between text-destructive">
                  <span>Penalización</span>
                  <span>-Q{refundBreakdown.cancellationPenalty.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-green-200 dark:border-green-800 mt-1 pt-1">
                <div className="flex justify-between font-semibold text-green-700 dark:text-green-400">
                  <span>Total a reembolsar</span>
                  <span>Q{refundBreakdown.totalRefund.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label>Razón de cancelación *</Label>
            <Select
              value={cancellationReason}
              onValueChange={(value) => setCancellationReason(value as PackageCancellationReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una razón" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGE_CANCELLATION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bank Details */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Datos Bancarios para Reembolso
            </Label>
            
            {isLoadingBankData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Nombre del banco"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                />
                <Input
                  placeholder="Número de cuenta"
                  value={bankDetails.bank_account_number}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bank_account_number: e.target.value }))}
                />
                <Input
                  placeholder="Nombre del titular"
                  value={bankDetails.bank_account_holder}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bank_account_holder: e.target.value }))}
                />
                <Select
                  value={bankDetails.bank_account_type}
                  onValueChange={(value) => setBankDetails(prev => ({ ...prev, bank_account_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monetaria">Monetaria</SelectItem>
                    <SelectItem value="Ahorro">Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Esta acción no se puede deshacer. El pedido será cancelado y se notificará al viajero.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingBankData || !cancellationReason}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

export default PackageCancellationModal;

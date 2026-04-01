import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RefundOrder {
  id: string;
  package_id: string;
  shopper_id: string;
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_account_type: string;
  amount: number;
  reason: string;
  cancelled_products: any[];
  status: 'pending' | 'completed' | 'rejected';
  notes: string | null;
  receipt_url: string | null;
  receipt_filename: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  completed_by: string | null;
  // Joined data
  package?: any;
  shopper?: any;
}

interface CreateRefundOrderParams {
  packageId: string;
  shopperId: string;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankAccountType: string;
  amount: number;
  reason: string;
  cancelledProducts: any[];
}

export const useRefundOrders = (shopperId?: string) => {
  const [refundOrders, setRefundOrders] = useState<RefundOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchRefundOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('refund_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (shopperId) {
        query = query.eq('shopper_id', shopperId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setRefundOrders((data || []) as RefundOrder[]);
    } catch (error) {
      console.error('Error fetching refund orders:', error);
      toast.error('Error al cargar órdenes de reembolso');
    } finally {
      setLoading(false);
    }
  }, [shopperId]);

  const createRefundOrder = async (params: CreateRefundOrderParams): Promise<RefundOrder | null> => {
    try {
      setCreating(true);
      
      // VALIDACIÓN: Verificar si ya existe una orden pendiente o aprobada para este paquete
      const { data: existingOrder, error: checkError } = await supabase
        .from('refund_orders')
        .select('id, status')
        .eq('package_id', params.packageId)
        .in('status', ['pending'])
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing refund orders:', checkError);
      }
      
      if (existingOrder) {
        toast.error('Ya existe una solicitud de reembolso pendiente para este paquete');
        return null;
      }
      
      // Usar RPC seguro para crear la orden (previene race conditions)
      // Cast to any because the RPC types are auto-generated and may not include this function yet
      const { data, error } = await (supabase.rpc as any)('create_refund_order_safe', {
        p_package_id: params.packageId,
        p_shopper_id: params.shopperId,
        p_bank_name: params.bankName,
        p_bank_account_holder: params.bankAccountHolder,
        p_bank_account_number: params.bankAccountNumber,
        p_bank_account_type: params.bankAccountType,
        p_amount: params.amount,
        p_reason: params.reason,
        p_cancelled_products: params.cancelledProducts
      });
      
      if (error) {
        // Handle specific error for duplicate
        if (error.message?.includes('Ya existe una orden de reembolso')) {
          toast.error('Ya existe una solicitud de reembolso pendiente para este paquete');
          return null;
        }
        throw error;
      }
      
      // Fetch the created order
      const newRefundId = data as string;
      const { data: newOrder, error: fetchError } = await supabase
        .from('refund_orders')
        .select('*')
        .eq('id', newRefundId)
        .single();
      
      if (fetchError) throw fetchError;
      
      toast.success('Solicitud de reembolso creada exitosamente');
      await fetchRefundOrders();
      return newOrder as RefundOrder;
    } catch (error) {
      console.error('Error creating refund order:', error);
      toast.error('Error al crear solicitud de reembolso');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateRefundOrder = async (
    id: string, 
    updates: Partial<Pick<RefundOrder, 'status' | 'notes' | 'receipt_url' | 'receipt_filename' | 'completed_at' | 'completed_by'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('refund_orders')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Orden de reembolso actualizada');
      await fetchRefundOrders();
      return true;
    } catch (error) {
      console.error('Error updating refund order:', error);
      toast.error('Error al actualizar orden de reembolso');
      return false;
    }
  };

  const getRefundOrdersForPackage = useCallback(async (packageId: string): Promise<RefundOrder[]> => {
    try {
      const { data, error } = await supabase
        .from('refund_orders')
        .select('*')
        .eq('package_id', packageId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as RefundOrder[];
    } catch (error) {
      console.error('Error fetching refund orders for package:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchRefundOrders();
  }, [fetchRefundOrders]);

  return {
    refundOrders,
    loading,
    creating,
    createRefundOrder,
    updateRefundOrder,
    refreshRefundOrders: fetchRefundOrders,
    getRefundOrdersForPackage
  };
};

// Hook for admin to get all refund orders with joined data
export const useAdminRefundOrders = () => {
  const [refundOrders, setRefundOrders] = useState<RefundOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllRefundOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch refund orders
      const { data: refunds, error: refundsError } = await supabase
        .from('refund_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (refundsError) throw refundsError;
      
      if (!refunds || refunds.length === 0) {
        setRefundOrders([]);
        return;
      }
      
      // Fetch related packages
      const packageIds = [...new Set(refunds.map(r => r.package_id))];
      const { data: packages } = await supabase
        .from('packages')
        .select('id, item_description, status, products_data, label_number')
        .in('id', packageIds);
      
      // Fetch related shoppers
      const shopperIds = [...new Set(refunds.map(r => r.shopper_id))];
      const { data: shoppers } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', shopperIds);
      
      // Join data
      const enrichedRefunds = refunds.map(refund => ({
        ...refund,
        package: packages?.find(p => p.id === refund.package_id),
        shopper: shoppers?.find(s => s.id === refund.shopper_id)
      }));
      
      setRefundOrders(enrichedRefunds as RefundOrder[]);
    } catch (error) {
      console.error('Error fetching admin refund orders:', error);
      toast.error('Error al cargar órdenes de reembolso');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRefundStatus = async (
    id: string,
    status: 'completed' | 'rejected',
    notes?: string,
    receiptUrl?: string,
    receiptFilename?: string,
    refundMethod?: 'bank_transfer' | 'account_credit',
    shopperId?: string,
    amount?: number
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates: any = { status, notes };
      
      // Siempre guardar receipt si se proporciona, sin importar el status
      if (receiptUrl) updates.receipt_url = receiptUrl;
      if (receiptFilename) updates.receipt_filename = receiptFilename;

      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user?.id;
        updates.refund_method = refundMethod || 'bank_transfer';
      }

      // Si es crédito a cuenta, insertar en referrals
      if (status === 'completed' && refundMethod === 'account_credit' && shopperId && amount) {
        const { error: creditError } = await supabase
          .from('referrals')
          .insert({
            referrer_id: shopperId,
            referred_id: shopperId,
            status: 'completed',
            reward_amount: amount,
            completed_at: new Date().toISOString(),
          });
        
        if (creditError) {
          console.error('Error inserting account credit:', creditError);
          toast.error('Error al acreditar saldo al shopper');
          return false;
        }
      }
      
      const { error } = await supabase
        .from('refund_orders')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      const methodLabel = refundMethod === 'account_credit' ? 'acreditado a cuenta' : 'completado';
      toast.success(`Reembolso ${status === 'completed' ? methodLabel : 'rechazado'}`);
      await fetchAllRefundOrders();
      return true;
    } catch (error) {
      console.error('Error updating refund status:', error);
      toast.error('Error al actualizar estado del reembolso');
      return false;
    }
  };

  const uploadRefundReceipt = async (refundId: string, file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${refundId}-${Date.now()}.${fileExt}`;
      const filePath = `refund-receipts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      return filePath;
    } catch (error) {
      console.error('Error uploading refund receipt:', error);
      toast.error('Error al subir comprobante');
      return null;
    }
  };

  useEffect(() => {
    fetchAllRefundOrders();
  }, [fetchAllRefundOrders]);

  return {
    refundOrders,
    loading,
    updateRefundStatus,
    uploadRefundReceipt,
    refreshRefundOrders: fetchAllRefundOrders
  };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type PaymentOrder = Tables<'payment_orders'>;
export type PaymentOrderInsert = TablesInsert<'payment_orders'>;

export const usePaymentOrders = () => {
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPaymentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .select(`
          *,
          trips (
            id,
            from_city,
            to_city,
            departure_date,
            arrival_date,
            user_id,
            packages:packages!matched_trip_id (
              id,
              item_description,
              estimated_price,
              status,
              quote
            )
          ),
          profiles!traveler_id (
            id,
            first_name,
            last_name,
            email,
            username,
            bank_account_holder,
            bank_name,
            bank_account_type,
            bank_account_number,
            bank_swift_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching payment orders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPaymentOrder = async (orderData: PaymentOrderInsert) => {
    try {
      // Usar RPC en lugar de inserción directa
      const { data: paymentOrderId, error } = await supabase
        .rpc('create_payment_order_with_snapshot', {
          _traveler_id: orderData.traveler_id,
          _trip_id: orderData.trip_id,
          _amount: orderData.amount,
          _bank_name: orderData.bank_name,
          _bank_account_holder: orderData.bank_account_holder,
          _bank_account_number: orderData.bank_account_number,
          _bank_account_type: orderData.bank_account_type
        });

      if (error) throw error;
      
      // Fetch the created order
      const { data: createdOrder, error: fetchError } = await supabase
        .from('payment_orders')
        .select(`
          *,
          trips (
            id,
            from_city,
            to_city,
            departure_date,
            arrival_date,
            user_id,
            packages:packages!matched_trip_id (
              id,
              item_description,
              estimated_price,
              status,
              quote
            )
          ),
          profiles!traveler_id (
            id,
            first_name,
            last_name,
            email,
            username,
            bank_account_holder,
            bank_name,
            bank_account_type,
            bank_account_number,
            bank_swift_code
          )
        `)
        .eq('id', paymentOrderId)
        .single();

      if (fetchError) throw fetchError;
      
      setPaymentOrders(prev => [createdOrder, ...prev]);
      
      toast({
        title: "¡Éxito!",
        description: "Orden de pago creada correctamente",
      });
      
      return createdOrder;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la orden de pago",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePaymentOrder = async (id: string, updates: Partial<PaymentOrder>) => {
    try {
      const { data, error } = await supabase
        .from('payment_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPaymentOrders(prev => prev.map(order => 
        order.id === id ? { ...order, ...data } : order
      ));

      // Si el pago se marca como completado, actualizar el viaje a completed_paid
      if (updates.status === 'completed' && data.trip_id) {
        const { error: tripError } = await supabase
          .from('trips')
          .update({ status: 'completed_paid' })
          .eq('id', data.trip_id);

        if (tripError) {
          console.error('Error updating trip status:', tripError);
        }
      }
      
      return data;
    } catch (error: any) {
      console.error('Error updating payment order:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la orden de pago",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPaymentOrders();
  }, []);

  return {
    paymentOrders,
    loading,
    createPaymentOrder,
    updatePaymentOrder,
    refreshPaymentOrders: fetchPaymentOrders
  };
};
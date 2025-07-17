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
          packages (
            id,
            item_description,
            quote,
            matched_trip_id,
            trips (
              id,
              from_city,
              to_city,
              departure_date,
              arrival_date
            )
          ),
          profiles!payment_orders_traveler_id_fkey (
            id,
            first_name,
            last_name,
            email,
            username
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
      const { data, error } = await supabase
        .from('payment_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      
      setPaymentOrders(prev => [data, ...prev]);
      
      // Crear notificación para el admin
      await supabase.rpc('create_notification', {
        _user_id: 'admin-user-id', // Esto debería ser el ID del admin
        _title: 'Nueva orden de pago',
        _message: `El viajero ${orderData.bank_account_holder} ha confirmado la entrega de paquetes`,
        _type: 'payment_order',
        _priority: 'high',
        _metadata: {
          payment_order_id: data.id,
          traveler_id: orderData.traveler_id,
          amount: orderData.amount
        }
      });
      
      toast({
        title: "¡Éxito!",
        description: "Orden de pago creada correctamente",
      });
      
      return data;
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
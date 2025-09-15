import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type PaymentOrder = Tables<'payment_orders'>;
export type PaymentOrderInsert = TablesInsert<'payment_orders'>;
export type PrimeMembership = Tables<'prime_memberships'>;

// Combined type for admin interface
export type CombinedPayment = {
  id: string;
  type: 'trip_payment' | 'prime_membership';
  amount: number;
  status: string;
  created_at: string;
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  receipt_url?: string;
  receipt_filename?: string;
  notes?: string;
  traveler_id?: string;
  trip_id?: string;
  user_id?: string;
  trips?: any;
  profiles?: any;
};

export const usePaymentOrders = () => {
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>([]);
  const [primeMemberships, setPrimeMemberships] = useState<PrimeMembership[]>([]);
  const [combinedPayments, setCombinedPayments] = useState<CombinedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPaymentOrders = async () => {
    try {
      // Fetch regular payment orders
      const { data: paymentData, error: paymentError } = await supabase
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
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;

      // Fetch prime memberships
      const { data: primeData, error: primeError } = await supabase
        .from('prime_memberships')
        .select(`
          *,
          profiles!user_id (
            id,
            first_name,
            last_name,
            email,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (primeError) throw primeError;

      setPaymentOrders(paymentData || []);
      setPrimeMemberships(primeData || []);

      // Combine both types for unified admin interface
      const combined: CombinedPayment[] = [
        ...(paymentData || []).map(payment => ({
          id: payment.id,
          type: 'trip_payment' as const,
          amount: payment.amount,
          status: payment.status,
          created_at: payment.created_at,
          bank_name: payment.bank_name,
          bank_account_holder: payment.bank_account_holder,
          bank_account_number: payment.bank_account_number,
          receipt_url: payment.receipt_url,
          receipt_filename: payment.receipt_filename,
          notes: payment.notes,
          traveler_id: payment.traveler_id,
          trip_id: payment.trip_id,
          trips: payment.trips,
          profiles: payment.profiles,
        })),
        ...(primeData || []).map(membership => ({
          id: membership.id,
          type: 'prime_membership' as const,
          amount: membership.amount,
          status: membership.status,
          created_at: membership.created_at,
          bank_name: membership.bank_name,
          bank_account_holder: membership.bank_account_holder,
          bank_account_number: membership.bank_account_number,
          receipt_url: membership.receipt_url,
          receipt_filename: membership.receipt_filename,
          notes: membership.notes,
          user_id: membership.user_id,
          profiles: membership.profiles,
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCombinedPayments(combined);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
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

  const updatePrimeMembership = async (id: string, updates: Partial<PrimeMembership>) => {
    try {
      const { data, error } = await supabase
        .from('prime_memberships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPrimeMemberships(prev => prev.map(membership => 
        membership.id === id ? { ...membership, ...data } : membership
      ));
      
      return data;
    } catch (error: any) {
      console.error('Error updating prime membership:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la membresía Prime",
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
    primeMemberships,
    combinedPayments,
    loading,
    createPaymentOrder,
    updatePaymentOrder,
    updatePrimeMembership,
    refreshPaymentOrders: fetchPaymentOrders
  };
};
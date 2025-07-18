import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TripPaymentAccumulator {
  id: string;
  trip_id: string;
  traveler_id: string;
  accumulated_amount: number;
  delivered_packages_count: number;
  total_packages_count: number;
  payment_order_created: boolean;
  created_at: string;
  updated_at: string;
}

export const useTripPayments = (tripId?: string) => {
  const [tripPayment, setTripPayment] = useState<TripPaymentAccumulator | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTripPayment = async () => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trip_payment_accumulator')
        .select('*')
        .eq('trip_id', tripId)
        .eq('traveler_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setTripPayment(data);
    } catch (error: any) {
      console.error('Error fetching trip payment:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de pagos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPaymentOrder = async (bankingInfo: any) => {
    if (!tripPayment || tripPayment.payment_order_created) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Actualizar perfil del usuario con información bancaria
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bank_account_holder: bankingInfo.bank_account_holder,
          bank_name: bankingInfo.bank_name,
          bank_account_type: bankingInfo.bank_account_type,
          bank_account_number: bankingInfo.bank_account_number
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Crear la orden de pago por viaje
      const { data: paymentOrder, error: paymentError } = await supabase
        .from('payment_orders')
        .insert({
          trip_id: tripId,
          traveler_id: user.id,
          amount: tripPayment.accumulated_amount,
          bank_account_holder: bankingInfo.bank_account_holder,
          bank_name: bankingInfo.bank_name,
          bank_account_type: bankingInfo.bank_account_type,
          bank_account_number: bankingInfo.bank_account_number,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Marcar como orden creada
      const { error: updateError } = await supabase
        .from('trip_payment_accumulator')
        .update({ payment_order_created: true })
        .eq('id', tripPayment.id);

      if (updateError) throw updateError;

      // Crear notificación para admin
      await supabase.from('notifications').insert({
        user_id: 'admin', // This should be replaced with actual admin user ID
        title: 'Nueva orden de pago pendiente',
        message: `Viajero solicita pago por viaje - Monto: Q${tripPayment.accumulated_amount}`,
        type: 'payment_request',
        priority: 'high'
      });

      setTripPayment(prev => prev ? { ...prev, payment_order_created: true } : null);

      toast({
        title: "¡Éxito!",
        description: "Solicitud de pago creada correctamente",
      });

      return paymentOrder;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la solicitud de pago",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTripPayment();
  }, [tripId]);

  // Refrescar datos cada 5 segundos para asegurar sincronización
  useEffect(() => {
    if (!tripId) return;
    
    const interval = setInterval(() => {
      fetchTripPayment();
    }, 5000);

    return () => clearInterval(interval);
  }, [tripId]);

  return {
    tripPayment,
    loading,
    createPaymentOrder,
    refreshTripPayment: fetchTripPayment
  };
};
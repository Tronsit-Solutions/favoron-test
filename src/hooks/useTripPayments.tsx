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
  all_packages_delivered: boolean;
  payment_order_created: boolean;
  payment_status?: string; // Agregar campo opcional para el status del pago
  created_at: string;
  updated_at: string;
}

export const useTripPayments = (tripId?: string) => {
  const [tripPayment, setTripPayment] = useState<TripPaymentAccumulator | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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

      // Si existe un accumulator, verificar si hay una payment order completada
      if (data) {
        const { data: paymentOrder, error: paymentError } = await supabase
          .from('payment_orders')
          .select('status')
          .eq('trip_id', tripId)
          .eq('traveler_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!paymentError && paymentOrder) {
          // Crear un nuevo objeto con la información del estado del pago
          const extendedData = { ...data, payment_status: paymentOrder.status };
          setTripPayment(extendedData);
        } else {
          setTripPayment(data);
        }
      } else {
        setTripPayment(data);
      }
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
    if (!tripPayment || tripPayment.payment_order_created || isCreating) return;

    setIsCreating(true);
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

      // Usar RPC que captura snapshots y maneja notificaciones automáticamente
      const { data: paymentOrderId, error: paymentError } = await supabase
        .rpc('create_payment_order_with_snapshot', {
          _traveler_id: user.id,
          _trip_id: tripId,
          _amount: tripPayment.accumulated_amount,
          _bank_name: bankingInfo.bank_name,
          _bank_account_holder: bankingInfo.bank_account_holder,
          _bank_account_number: bankingInfo.bank_account_number,
          _bank_account_type: bankingInfo.bank_account_type
        });

      if (paymentError) throw paymentError;

      // Actualizar estado local
      setTripPayment(prev => prev ? { ...prev, payment_order_created: true } : null);

      toast({
        title: "¡Éxito!",
        description: "Solicitud de pago creada correctamente",
      });

      return paymentOrderId;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la solicitud de pago",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchTripPayment();
  }, [tripId]);

  // Usar real-time subscriptions en lugar de polling para mejor performance
  useEffect(() => {
    if (!tripId) return;
    
    const channel = supabase
      .channel('trip-payment-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_payment_accumulator',
          filter: `trip_id=eq.${tripId}`
        },
        () => {
          fetchTripPayment();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_orders',
          filter: `trip_id=eq.${tripId}`
        },
        () => {
          fetchTripPayment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  return {
    tripPayment,
    loading,
    isCreating,
    createPaymentOrder,
    refreshTripPayment: fetchTripPayment
  };
};
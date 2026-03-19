import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateTripPaymentAccumulator } from '@/hooks/useCreateTripPaymentAccumulator';

export interface TripPaymentAccumulator {
  id: string;
  trip_id: string;
  traveler_id: string;
  accumulated_amount: number;
  boost_amount: number;
  delivered_packages_count: number;
  total_packages_count: number;
  all_packages_delivered: boolean;
  payment_order_created: boolean;
  payment_status?: string;
  payment_receipt_url?: string;
  payment_receipt_filename?: string;
  payment_completed_at?: string;
  payment_completed_by?: string;
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
      console.log('🔍 useTripPayments - Fetching trip payment for tripId:', tripId);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('trip_payment_accumulator')
        .select('*')
        .eq('trip_id', tripId)
        .eq('traveler_id', user.id)
        .maybeSingle();

      if (error) throw error;

      console.log('💾 useTripPayments - Trip payment accumulator data:', data);

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

        console.log('💳 useTripPayments - Payment order data:', paymentOrder);

        // Auto-corregir inconsistencia: payment_order_created=true pero no hay payment_order
        if (data.payment_order_created && !paymentOrder) {
          console.warn('⚠️ useTripPayments - Inconsistencia detectada: payment_order_created=true pero no hay payment_order. Corrigiendo...');
          
          const { error: updateError } = await supabase
            .from('trip_payment_accumulator')
            .update({ payment_order_created: false, updated_at: new Date().toISOString() })
            .eq('id', data.id);
            
          if (!updateError) {
            data.payment_order_created = false;
            console.log('✅ useTripPayments - Inconsistencia corregida automáticamente');
          } else {
            console.error('❌ useTripPayments - Error corrigiendo inconsistencia:', updateError);
          }
        }

        if (!paymentError && paymentOrder) {
          // Crear un nuevo objeto con la información del estado del pago
          const extendedData = { ...data, payment_status: paymentOrder.status };
          console.log('📋 useTripPayments - Extended data with payment status:', extendedData);
          setTripPayment(extendedData);
        } else {
          setTripPayment(data);
        }
      } else {
        console.log('❌ useTripPayments - No trip payment accumulator found');
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
    if (!tripPayment || isCreating) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Verificar si existe una payment order real antes de crear una nueva
      const { data: existingOrder } = await supabase
        .from('payment_orders')
        .select('id, status')
        .eq('trip_id', tripId)
        .eq('traveler_id', user.id)
        .in('status', ['pending', 'completed'])
        .maybeSingle();

      if (existingOrder) {
        toast({
          title: "Orden ya existe",
          description: "Ya existe una solicitud de pago activa para este viaje",
        });
        setIsCreating(false);
        return existingOrder.id;
      }

      // 🔄 Recalcular el acumulador ANTES de crear la orden de pago
      // Esto garantiza que el monto refleje TODOS los paquetes entregados al momento
      console.log('🔄 Recalculando acumulador antes de crear orden de pago...');
      await createOrUpdateTripPaymentAccumulator(tripId!, user.id);

      // Leer el acumulador actualizado de la base de datos
      const { data: freshAccumulator, error: accError } = await supabase
        .from('trip_payment_accumulator')
        .select('accumulated_amount')
        .eq('trip_id', tripId)
        .eq('traveler_id', user.id)
        .maybeSingle();

      if (accError) throw accError;

      const freshAmount = freshAccumulator?.accumulated_amount ?? tripPayment.accumulated_amount;
      console.log('💰 Monto recalculado:', freshAmount, '(anterior:', tripPayment.accumulated_amount, ')');

      if (freshAmount <= 0) {
        toast({
          title: "Sin monto pendiente",
          description: "No hay monto acumulado para solicitar pago",
          variant: "destructive",
        });
        setIsCreating(false);
        return;
      }

      // Actualizar información bancaria del usuario
      const { error: profileError } = await supabase
        .from('user_financial_data')
        .upsert({
          user_id: user.id,
          bank_account_holder: bankingInfo.bank_account_holder,
          bank_name: bankingInfo.bank_name,
          bank_account_type: bankingInfo.bank_account_type,
          bank_account_number: bankingInfo.bank_account_number
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Usar RPC que captura snapshots y maneja notificaciones automáticamente
      const { data: paymentOrderId, error: paymentError } = await supabase
        .rpc('create_payment_order_with_snapshot', {
          _traveler_id: user.id,
          _trip_id: tripId,
          _amount: freshAmount,
          _bank_name: bankingInfo.bank_name,
          _bank_account_holder: bankingInfo.bank_account_holder,
          _bank_account_number: bankingInfo.bank_account_number,
          _bank_account_type: bankingInfo.bank_account_type
        });

      if (paymentError) throw paymentError;

      // Actualizar estado local
      setTripPayment(prev => prev ? { ...prev, payment_order_created: true } : null);

      // Toast removido - el mensaje ahora se muestra en el paso de éxito del wizard
      // WhatsApp notification temporalmente deshabilitado hasta configurar Twilio correctamente
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
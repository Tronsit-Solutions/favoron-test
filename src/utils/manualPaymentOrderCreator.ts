import { supabase } from '@/integrations/supabase/client';
import { createOrUpdateTripPaymentAccumulator } from '@/hooks/useCreateTripPaymentAccumulator';

export const createManualPaymentOrderForRodrigo = async () => {
  try {
    console.log('🔧 Creating accumulator for Rodrigo Zibara trip...');
    
    // Paso 1: Crear/actualizar el acumulador
    const accumulatorResult = await createOrUpdateTripPaymentAccumulator(
      '0e661163-e3c6-4306-bf03-e0fb8ac7d9fb', // Trip ID
      '73c1d68d-2afd-4e5f-b9fa-c812939c5dc2'  // Traveler ID (Rodrigo)
    );

    if (!accumulatorResult.success) {
      throw new Error('Failed to create accumulator');
    }

    console.log('✅ Accumulator created successfully');

    // Paso 2: Crear la payment order usando la función RPC
    const { data: paymentOrderId, error: paymentError } = await supabase.rpc(
      'create_payment_order_with_snapshot',
      {
        _trip_id: '0e661163-e3c6-4306-bf03-e0fb8ac7d9fb',
        _traveler_id: '73c1d68d-2afd-4e5f-b9fa-c812939c5dc2',
        _amount: 140,
        _bank_account_holder: 'Rodrigo Zibara Leal',
        _bank_account_number: '4570059511',
        _bank_account_type: 'monetaria',
        _bank_name: 'BI'
      }
    );

    if (paymentError) {
      console.error('Error creating payment order:', paymentError);
      throw paymentError;
    }

    console.log('✅ Payment order created:', paymentOrderId);

    return {
      success: true,
      paymentOrderId,
      message: 'Payment order created successfully for Rodrigo Zibara - Q140'
    };

  } catch (error) {
    console.error('Error creating manual payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

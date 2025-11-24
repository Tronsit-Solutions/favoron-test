import { supabase } from '@/integrations/supabase/client';

export const createManualPaymentOrderForRodrigo = async () => {
  try {
    console.log('🔧 Creating payment order for Rodrigo Zibara...');
    
    const { data, error } = await supabase.functions.invoke('create-manual-payment-order', {
      body: {
        tripId: '0e661163-e3c6-4306-bf03-e0fb8ac7d9fb',
        travelerId: '73c1d68d-2afd-4e5f-b9fa-c812939c5dc2',
        amount: 140,
        bankAccountHolder: 'Rodrigo Zibara Leal',
        bankAccountNumber: '4570059511',
        bankAccountType: 'monetaria',
        bankName: 'BI'
      }
    });

    if (error) {
      console.error('Error calling edge function:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to create payment order');
    }

    console.log('✅ Payment order created:', data.paymentOrderId);

    return {
      success: true,
      paymentOrderId: data.paymentOrderId,
      message: `Payment order created successfully for Rodrigo Zibara - Q${data.accumulatedAmount}`
    };

  } catch (error) {
    console.error('Error creating manual payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

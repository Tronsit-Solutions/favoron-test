import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package } from '@/types';

interface CreateCheckoutParams {
  packageId: string;
  amount: number;
  itemDescription: string;
}

interface CheckoutResult {
  checkout_id: string;
  checkout_url: string;
  success: boolean;
}

export function useRecurrenteCheckout() {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createCheckout = useCallback(async ({
    packageId,
    amount,
    itemDescription
  }: CreateCheckoutParams): Promise<CheckoutResult | null> => {
    setLoading(true);
    setError(null);
    setCheckoutUrl(null);

    try {
      console.log('Creating Recurrente checkout:', { packageId, amount, itemDescription });

      const { data, error: invokeError } = await supabase.functions.invoke('create-recurrente-checkout', {
        body: {
          package_id: packageId,
          amount,
          item_description: itemDescription,
          success_url: `${window.location.origin}/payment-callback?payment=success&package_id=${packageId}&amount=${amount}`,
          cancel_url: `${window.location.origin}/payment-callback?payment=cancelled&package_id=${packageId}`
        }
      });

      if (invokeError) {
        console.error('Edge function error:', invokeError);
        throw new Error(invokeError.message || 'Error al crear el checkout');
      }

      if (!data?.success || !data?.checkout_url) {
        console.error('Invalid response:', data);
        throw new Error(data?.error || 'Respuesta inválida del servidor');
      }

      console.log('Checkout created successfully:', data);
      setCheckoutUrl(data.checkout_url);

      return {
        checkout_id: data.checkout_id,
        checkout_url: data.checkout_url,
        success: true
      };

    } catch (err: any) {
      console.error('Error creating checkout:', err);
      const errorMessage = err.message || 'Error al procesar el pago con tarjeta';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetCheckout = useCallback(() => {
    setCheckoutUrl(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    checkoutUrl,
    error,
    createCheckout,
    resetCheckout
  };
}

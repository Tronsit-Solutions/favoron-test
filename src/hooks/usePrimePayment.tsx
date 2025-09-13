import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFavoronBankingInfo } from '@/hooks/useFavoronBankingInfo';

export const usePrimePayment = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { account: favoronAccount, loading: bankingLoading } = useFavoronBankingInfo();

  const createPrimePaymentOrder = useCallback(async () => {
    if (!user || !favoronAccount) {
      toast({
        title: "Error",
        description: "Usuario o información bancaria no disponible",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsCreating(true);

    try {
      // Create a Prime membership payment order
      const { data: paymentOrder, error } = await supabase
        .from('payment_orders')
        .insert({
          traveler_id: user.id,
          trip_id: '00000000-0000-0000-0000-000000000000', // Dummy trip ID for Prime payments
          amount: 200, // Fixed Q200 for Prime membership
          payment_type: 'prime_membership',
          bank_name: favoronAccount.bank_name,
          bank_account_holder: favoronAccount.account_holder,
          bank_account_number: favoronAccount.account_number,
          bank_account_type: favoronAccount.account_type,
          notes: 'Pago de membresía Favorón Prime - 1 año',
          historical_packages: [],
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "✨ Solicitud de Prime creada",
        description: "Tu solicitud de membresía Prime ha sido enviada. Realiza el pago y será procesada por un administrador.",
      });

      return { success: true, paymentOrder };
    } catch (error: any) {
      console.error('Error creating Prime payment order:', error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la solicitud de pago Prime",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsCreating(false);
    }
  }, [user, favoronAccount, toast]);

  return {
    createPrimePaymentOrder,
    isCreating,
    favoronAccount,
    bankingLoading
  };
};
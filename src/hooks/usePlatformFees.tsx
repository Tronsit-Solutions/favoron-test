import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PlatformFees {
  id: string;
  service_fee_rate_standard: number;
  service_fee_rate_prime: number;
  delivery_fee_guatemala_city: number;
  delivery_fee_guatemala_department: number;
  delivery_fee_outside_city: number;
  prime_delivery_discount: number;
  prime_membership_price: number;
  cancellation_penalty_amount: number;
  prime_penalty_exempt: boolean;
}

const DEFAULT_FEES: Omit<PlatformFees, 'id'> = {
  service_fee_rate_standard: 0.50,
  service_fee_rate_prime: 0.25,
  delivery_fee_guatemala_city: 25,
  delivery_fee_guatemala_department: 45,
  delivery_fee_outside_city: 60,
  prime_delivery_discount: 25,
  prime_membership_price: 200,
  cancellation_penalty_amount: 5,
  prime_penalty_exempt: true,
};

export const usePlatformFees = () => {
  const [fees, setFees] = useState<PlatformFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('favoron_company_information')
        .select('id, service_fee_rate_standard, service_fee_rate_prime, delivery_fee_guatemala_city, delivery_fee_guatemala_department, delivery_fee_outside_city, prime_delivery_discount, prime_membership_price, cancellation_penalty_amount, prime_penalty_exempt')
        .eq('is_active', true)
        .single();

      if (fetchError) {
        console.error('Error fetching platform fees:', fetchError);
        setError('Error al cargar las tarifas');
        return;
      }

      if (data) {
        setFees({
          id: data.id,
          service_fee_rate_standard: data.service_fee_rate_standard ?? DEFAULT_FEES.service_fee_rate_standard,
          service_fee_rate_prime: data.service_fee_rate_prime ?? DEFAULT_FEES.service_fee_rate_prime,
          delivery_fee_guatemala_city: data.delivery_fee_guatemala_city ?? DEFAULT_FEES.delivery_fee_guatemala_city,
          delivery_fee_guatemala_department: (data as any).delivery_fee_guatemala_department ?? DEFAULT_FEES.delivery_fee_guatemala_department,
          delivery_fee_outside_city: data.delivery_fee_outside_city ?? DEFAULT_FEES.delivery_fee_outside_city,
          prime_delivery_discount: data.prime_delivery_discount ?? DEFAULT_FEES.prime_delivery_discount,
          prime_membership_price: data.prime_membership_price ?? DEFAULT_FEES.prime_membership_price,
          cancellation_penalty_amount: data.cancellation_penalty_amount ?? DEFAULT_FEES.cancellation_penalty_amount,
          prime_penalty_exempt: data.prime_penalty_exempt ?? DEFAULT_FEES.prime_penalty_exempt,
        });
      }
    } catch (err) {
      console.error('Error in fetchFees:', err);
      setError('Error inesperado al cargar las tarifas');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFees = useCallback(async (updatedFees: Partial<Omit<PlatformFees, 'id'>>) => {
    if (!fees?.id) {
      toast({
        title: 'Error',
        description: 'No se encontró el registro de tarifas',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from('favoron_company_information')
        .update({
          ...updatedFees,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', fees.id);

      if (updateError) {
        console.error('Error updating platform fees:', updateError);
        toast({
          title: 'Error',
          description: 'No se pudieron guardar las tarifas',
          variant: 'destructive',
        });
        return false;
      }

      setFees(prev => prev ? { ...prev, ...updatedFees } : null);

      toast({
        title: 'Tarifas actualizadas',
        description: 'Los cambios se han guardado correctamente',
      });

      return true;
    } catch (err) {
      console.error('Error in updateFees:', err);
      toast({
        title: 'Error',
        description: 'Error inesperado al guardar las tarifas',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [fees?.id]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  return {
    fees,
    loading,
    saving,
    error,
    updateFees,
    refresh: fetchFees,
    defaultFees: DEFAULT_FEES,
  };
};

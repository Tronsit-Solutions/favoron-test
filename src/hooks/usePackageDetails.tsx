import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PackageDetails {
  products_data?: any;
  payment_receipt?: any;
  purchase_confirmation?: any;
  tracking_info?: any;
  office_delivery?: any;
  quote?: any;
}

interface UsePackageDetailsReturn {
  details: PackageDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for loading heavy package details on-demand
 * Only fetches JSONB fields when needed (e.g., when opening detail modals)
 */
export const usePackageDetails = (packageId: string | null): UsePackageDetailsReturn => {
  const [details, setDetails] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!packageId) {
      setDetails(null);
      return;
    }

    setLoading(true);
    setError(null);
    setDetails(null);

    try {
      console.log('🔄 Loading package details on-demand for:', packageId);
      
      const { data, error: fetchError } = await supabase
        .from('packages')
        .select(`
          products_data,
          payment_receipt,
          purchase_confirmation,
          tracking_info,
          office_delivery,
          quote
        `)
        .eq('id', packageId)
        .single();

      if (fetchError) {
        console.error('❌ Error loading package details:', fetchError);
        throw fetchError;
      }

      console.log('✅ Package details loaded successfully');
      setDetails(data);
    } catch (err: any) {
      console.error('❌ Failed to load package details:', err);
      setError(err.message || 'Error al cargar detalles del paquete');
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [packageId]);

  return {
    details,
    loading,
    error,
    refetch: fetchDetails
  };
};

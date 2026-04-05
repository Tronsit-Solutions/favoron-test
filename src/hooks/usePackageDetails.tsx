import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PackageDetails {
  products_data?: any;
  payment_receipt?: any;
  purchase_confirmation?: any;
  tracking_info?: any;
  office_delivery?: any;
  quote?: any;
  purchase_origin?: string;
  package_destination?: string;
  package_destination_country?: string | null;
  additional_notes?: string | null;
  item_description?: string;
  item_link?: string | null;
  estimated_price?: number | null;
  delivery_deadline?: string;
  status?: string;
}

interface UsePackageDetailsReturn {
  details: PackageDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for loading package details on-demand when opening detail modals.
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
          quote,
          purchase_origin,
          package_destination,
          package_destination_country,
          additional_notes,
          item_description,
          item_link,
          estimated_price,
          delivery_deadline,
          status
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
    refetch: fetchDetails,
  };
};
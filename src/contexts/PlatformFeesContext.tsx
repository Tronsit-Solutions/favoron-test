import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PRICING_CONFIG } from '@/lib/constants';
import { getDeliveryZone } from '@/lib/pricing';

export interface PlatformFeesConfig {
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

interface PlatformFeesContextValue {
  fees: PlatformFeesConfig;
  loading: boolean;
  error: string | null;
  
  getServiceFeeRate: (trustLevel?: string) => number;
  calculateServiceFee: (basePrice: number, trustLevel?: string) => number;
  getDeliveryFee: (deliveryMethod: string, trustLevel?: string, cityArea?: string) => number;
  
  rates: {
    standard: number;
    prime: number;
  };
  
  refresh: () => Promise<void>;
}

const FALLBACK_FEES: PlatformFeesConfig = {
  service_fee_rate_standard: PRICING_CONFIG.SERVICE_FEE_RATE_STANDARD,
  service_fee_rate_prime: PRICING_CONFIG.SERVICE_FEE_RATE_PRIME,
  delivery_fee_guatemala_city: PRICING_CONFIG.STANDARD_DELIVERY_FEE,
  delivery_fee_guatemala_department: PRICING_CONFIG.GUATEMALA_DEPT_DELIVERY_FEE,
  delivery_fee_outside_city: PRICING_CONFIG.OUTSIDE_CITY_DELIVERY_FEE,
  prime_delivery_discount: PRICING_CONFIG.PRIME_DISCOUNT,
  prime_membership_price: 200,
  cancellation_penalty_amount: 5,
  prime_penalty_exempt: true,
};

const PlatformFeesContext = createContext<PlatformFeesContextValue | undefined>(undefined);

export const PlatformFeesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fees, setFees] = useState<PlatformFeesConfig>(FALLBACK_FEES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('favoron_company_information')
        .select('service_fee_rate_standard, service_fee_rate_prime, delivery_fee_guatemala_city, delivery_fee_guatemala_department, delivery_fee_outside_city, prime_delivery_discount, prime_membership_price, cancellation_penalty_amount, prime_penalty_exempt')
        .eq('is_active', true)
        .single();

      if (fetchError) {
        console.warn('⚠️ PlatformFeesContext: Error fetching fees, using fallback:', fetchError);
        setError('Error al cargar tarifas, usando valores por defecto');
        return;
      }

      if (data) {
        setFees({
          service_fee_rate_standard: data.service_fee_rate_standard ?? FALLBACK_FEES.service_fee_rate_standard,
          service_fee_rate_prime: data.service_fee_rate_prime ?? FALLBACK_FEES.service_fee_rate_prime,
          delivery_fee_guatemala_city: data.delivery_fee_guatemala_city ?? FALLBACK_FEES.delivery_fee_guatemala_city,
          delivery_fee_guatemala_department: (data as any).delivery_fee_guatemala_department ?? FALLBACK_FEES.delivery_fee_guatemala_department,
          delivery_fee_outside_city: data.delivery_fee_outside_city ?? FALLBACK_FEES.delivery_fee_outside_city,
          prime_delivery_discount: data.prime_delivery_discount ?? FALLBACK_FEES.prime_delivery_discount,
          prime_membership_price: data.prime_membership_price ?? FALLBACK_FEES.prime_membership_price,
          cancellation_penalty_amount: data.cancellation_penalty_amount ?? FALLBACK_FEES.cancellation_penalty_amount,
          prime_penalty_exempt: data.prime_penalty_exempt ?? FALLBACK_FEES.prime_penalty_exempt,
        });
      }
    } catch (err) {
      console.error('PlatformFeesContext: Unexpected error:', err);
      setError('Error inesperado al cargar tarifas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const getServiceFeeRate = useCallback((trustLevel?: string): number => {
    if (trustLevel === 'prime') return fees.service_fee_rate_prime;
    return fees.service_fee_rate_standard;
  }, [fees.service_fee_rate_prime, fees.service_fee_rate_standard]);

  const calculateServiceFee = useCallback((basePrice: number, trustLevel?: string): number => {
    return basePrice * getServiceFeeRate(trustLevel);
  }, [getServiceFeeRate]);

  const getDeliveryFeeHelper = useCallback((
    deliveryMethod: string = 'pickup',
    trustLevel?: string,
    cityArea?: string
  ): number => {
    if (deliveryMethod === 'pickup') return 0;
    
    const zone = getDeliveryZone(cityArea);
    const discount = fees.prime_delivery_discount;
    
    if (zone === 'guatemala_city') {
      return trustLevel === 'prime' ? 0 : fees.delivery_fee_guatemala_city;
    }
    
    if (zone === 'guatemala_department') {
      return trustLevel === 'prime' 
        ? Math.max(0, fees.delivery_fee_guatemala_department - discount)
        : fees.delivery_fee_guatemala_department;
    }
    
    // outside
    return trustLevel === 'prime'
      ? Math.max(0, fees.delivery_fee_outside_city - discount)
      : fees.delivery_fee_outside_city;
  }, [fees.delivery_fee_guatemala_city, fees.delivery_fee_guatemala_department, fees.delivery_fee_outside_city, fees.prime_delivery_discount]);

  const rates = useMemo(() => ({
    standard: fees.service_fee_rate_standard,
    prime: fees.service_fee_rate_prime,
  }), [fees.service_fee_rate_standard, fees.service_fee_rate_prime]);

  const value = useMemo(() => ({
    fees,
    loading,
    error,
    getServiceFeeRate,
    calculateServiceFee,
    getDeliveryFee: getDeliveryFeeHelper,
    rates,
    refresh: fetchFees,
  }), [fees, loading, error, getServiceFeeRate, calculateServiceFee, getDeliveryFeeHelper, rates, fetchFees]);

  return (
    <PlatformFeesContext.Provider value={value}>
      {children}
    </PlatformFeesContext.Provider>
  );
};

export const usePlatformFeesContext = (): PlatformFeesContextValue => {
  const context = useContext(PlatformFeesContext);
  if (context === undefined) {
    throw new Error('usePlatformFeesContext must be used within a PlatformFeesProvider');
  }
  return context;
};

export const usePlatformRates = () => {
  const context = useContext(PlatformFeesContext);
  
  if (context) {
    return {
      standardRate: context.fees.service_fee_rate_standard,
      primeRate: context.fees.service_fee_rate_prime,
      loading: context.loading,
    };
  }
  
  return {
    standardRate: FALLBACK_FEES.service_fee_rate_standard,
    primeRate: FALLBACK_FEES.service_fee_rate_prime,
    loading: false,
  };
};

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PRICING_CONFIG } from '@/lib/constants';

export interface PlatformFeesConfig {
  service_fee_rate_standard: number;
  service_fee_rate_prime: number;
  delivery_fee_guatemala_city: number;
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
  
  // Helper functions that use DB values
  getServiceFeeRate: (trustLevel?: string) => number;
  calculateServiceFee: (basePrice: number, trustLevel?: string) => number;
  getDeliveryFee: (deliveryMethod: string, trustLevel?: string, cityArea?: string) => number;
  
  // Raw rates for edge cases
  rates: {
    standard: number;
    prime: number;
  };
  
  refresh: () => Promise<void>;
}

// Fallback values from PRICING_CONFIG (used if DB fetch fails)
const FALLBACK_FEES: PlatformFeesConfig = {
  service_fee_rate_standard: PRICING_CONFIG.SERVICE_FEE_RATE_STANDARD, // 0.50
  service_fee_rate_prime: PRICING_CONFIG.SERVICE_FEE_RATE_PRIME, // 0.25
  delivery_fee_guatemala_city: PRICING_CONFIG.STANDARD_DELIVERY_FEE, // 25
  delivery_fee_outside_city: PRICING_CONFIG.OUTSIDE_CITY_DELIVERY_FEE, // 60
  prime_delivery_discount: PRICING_CONFIG.PRIME_DISCOUNT, // 25
  prime_membership_price: 200,
  cancellation_penalty_amount: 5,
  prime_penalty_exempt: true,
};

const PlatformFeesContext = createContext<PlatformFeesContextValue | undefined>(undefined);

/**
 * Check if a cityArea is "Guatemala" (capital city only)
 */
const isGuatemalaCityArea = (cityArea?: string): boolean => {
  if (!cityArea) return false;
  const normalized = cityArea.toLowerCase().trim();
  
  const excludedAreas = [
    'mixco', 'villa nueva', 'villanueva', 'villa canales', 'villacanales',
    'san miguel petapa', 'petapa', 'amatitlan', 'amatitlán', 'fraijanes',
    'santa catarina pinula', 'chinautla', 'san jose pinula', 'san josé pinula',
    'palencia', 'san pedro ayampuc', 'san juan sacatepequez', 'san juan sacatepéquez',
    'condado naranjo', 'san cristobal', 'san cristóbal', 'carretera a el salvador',
    'carretera el salvador',
  ];
  
  if (excludedAreas.some(excluded => normalized.includes(excluded))) {
    return false;
  }
  
  const guatemalaCityPatterns = [
    /^guatemala$/,
    /^guatemala\s*city$/i,
    /^ciudad\s*de\s*guatemala/i,
    /^guatemala\s*,?\s*guatemala$/i,
    /^guatemala\s+zona\s*\d+/i,
    /zona\s*\d+.*ciudad\s*de\s*guatemala/i,
    /^zona\s*\d+.*guatemala$/i,
    /^guate$/i,
  ];
  
  return guatemalaCityPatterns.some(pattern => pattern.test(normalized));
};

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
        .select('service_fee_rate_standard, service_fee_rate_prime, delivery_fee_guatemala_city, delivery_fee_outside_city, prime_delivery_discount, prime_membership_price, cancellation_penalty_amount, prime_penalty_exempt')
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
          delivery_fee_outside_city: data.delivery_fee_outside_city ?? FALLBACK_FEES.delivery_fee_outside_city,
          prime_delivery_discount: data.prime_delivery_discount ?? FALLBACK_FEES.prime_delivery_discount,
          prime_membership_price: data.prime_membership_price ?? FALLBACK_FEES.prime_membership_price,
          cancellation_penalty_amount: data.cancellation_penalty_amount ?? FALLBACK_FEES.cancellation_penalty_amount,
          prime_penalty_exempt: data.prime_penalty_exempt ?? FALLBACK_FEES.prime_penalty_exempt,
        });
        console.log('✅ PlatformFeesContext: Fees loaded from DB:', {
          standard: data.service_fee_rate_standard,
          prime: data.service_fee_rate_prime,
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

  // Helper: get service fee rate for a trust level
  const getServiceFeeRate = useCallback((trustLevel?: string): number => {
    if (trustLevel === 'prime') {
      return fees.service_fee_rate_prime;
    }
    return fees.service_fee_rate_standard;
  }, [fees.service_fee_rate_prime, fees.service_fee_rate_standard]);

  // Helper: calculate service fee for a base price
  const calculateServiceFee = useCallback((basePrice: number, trustLevel?: string): number => {
    const rate = getServiceFeeRate(trustLevel);
    return basePrice * rate;
  }, [getServiceFeeRate]);

  // Helper: get delivery fee based on method, trust level, and city area
  const getDeliveryFee = useCallback((
    deliveryMethod: string = 'pickup',
    trustLevel?: string,
    cityArea?: string
  ): number => {
    if (deliveryMethod === 'pickup') return 0;
    
    const isGuatemala = isGuatemalaCityArea(cityArea);
    
    // Prime users in Guatemala city get free delivery
    if (trustLevel === 'prime' && isGuatemala) {
      return 0;
    }
    
    // Prime users outside Guatemala city get discount
    if (trustLevel === 'prime' && !isGuatemala) {
      return fees.delivery_fee_outside_city - fees.prime_delivery_discount;
    }
    
    // Standard users
    return isGuatemala 
      ? fees.delivery_fee_guatemala_city 
      : fees.delivery_fee_outside_city;
  }, [fees.delivery_fee_guatemala_city, fees.delivery_fee_outside_city, fees.prime_delivery_discount]);

  // Raw rates for components that need them directly
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
    getDeliveryFee,
    rates,
    refresh: fetchFees,
  }), [fees, loading, error, getServiceFeeRate, calculateServiceFee, getDeliveryFee, rates, fetchFees]);

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

// Export a hook that can be used outside the context (for edge cases)
// Returns the rates or fallback values
export const usePlatformRates = () => {
  const context = useContext(PlatformFeesContext);
  
  // If context is available, use it
  if (context) {
    return {
      standardRate: context.fees.service_fee_rate_standard,
      primeRate: context.fees.service_fee_rate_prime,
      loading: context.loading,
    };
  }
  
  // Fallback for components outside the provider
  return {
    standardRate: FALLBACK_FEES.service_fee_rate_standard,
    primeRate: FALLBACK_FEES.service_fee_rate_prime,
    loading: false,
  };
};

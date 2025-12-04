import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FavoronCompanyInfo = {
  id?: string;
  // Banking Information
  bank_name: string;
  account_holder: string;
  account_number: string;
  account_type: string;
  // Company Information
  company_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state_department?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  // Cancellation penalty
  cancellation_penalty_amount?: number;
  // System fields
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export function useFavoronCompanyInfo(packageId?: string) {
  const [companyInfo, setCompanyInfo] = useState<FavoronCompanyInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (packageId) {
        const { data, error } = await supabase.rpc('get_favoron_bank_info', { _package_id: packageId });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        setCompanyInfo(row ? {
          bank_name: row.bank_name,
          account_holder: row.account_holder,
          account_number: row.account_number,
          account_type: row.account_type
        } as FavoronCompanyInfo : null);
      } else {
        const { data, error } = await supabase
          .from('favoron_company_information')
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setCompanyInfo(data || null);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching company information');
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const saveCompanyInfo = useCallback(async (values: FavoronCompanyInfo) => {
    // If we have company info, update it; otherwise insert a new one
    if (companyInfo?.id) {
      const { data, error } = await supabase
        .from('favoron_company_information')
        .update({
          bank_name: values.bank_name,
          account_holder: values.account_holder,
          account_number: values.account_number,
          account_type: values.account_type,
          company_name: values.company_name,
          address_line_1: values.address_line_1,
          address_line_2: values.address_line_2,
          city: values.city,
          state_department: values.state_department,
          postal_code: values.postal_code,
          country: values.country,
          phone_number: values.phone_number,
          email: values.email,
          website: values.website,
          cancellation_penalty_amount: values.cancellation_penalty_amount,
          is_active: true,
        })
        .eq('id', companyInfo.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      setCompanyInfo(data || values);
      return data || values;
    } else {
      const { data, error } = await supabase
        .from('favoron_company_information')
        .insert({
          bank_name: values.bank_name,
          account_holder: values.account_holder,
          account_number: values.account_number,
          account_type: values.account_type,
          company_name: values.company_name,
          address_line_1: values.address_line_1,
          address_line_2: values.address_line_2,
          city: values.city,
          state_department: values.state_department,
          postal_code: values.postal_code,
          country: values.country,
          phone_number: values.phone_number,
          email: values.email,
          website: values.website,
          cancellation_penalty_amount: values.cancellation_penalty_amount,
          is_active: true,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      setCompanyInfo(data || values);
      return data || values;
    }
  }, [companyInfo]);

  return { 
    companyInfo, 
    loading, 
    error, 
    refresh: fetchCompanyInfo, 
    saveCompanyInfo,
    // Backward compatibility
    account: companyInfo,
    saveAccount: saveCompanyInfo
  };
}

// Backward compatibility exports
export type FavoronBankAccount = FavoronCompanyInfo;
export const useFavoronBankingInfo = useFavoronCompanyInfo;

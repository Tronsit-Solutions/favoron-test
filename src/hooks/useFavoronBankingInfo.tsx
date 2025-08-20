import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FavoronBankAccount = {
  id?: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  account_type: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export function useFavoronBankingInfo(packageId?: string) {
  const [account, setAccount] = useState<FavoronBankAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (packageId) {
        const { data, error } = await supabase.rpc('get_favoron_bank_info', { _package_id: packageId });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        setAccount(row ? {
          bank_name: row.bank_name,
          account_holder: row.account_holder,
          account_number: row.account_number,
          account_type: row.account_type
        } as FavoronBankAccount : null);
      } else {
        const { data, error } = await supabase
          .from('favoron_bank_accounts')
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setAccount(data || null);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching bank account');
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const saveAccount = useCallback(async (values: FavoronBankAccount) => {
    // If we have an account, update it; otherwise insert a new one
    if (account?.id) {
      const { data, error } = await supabase
        .from('favoron_bank_accounts')
        .update({
          bank_name: values.bank_name,
          account_holder: values.account_holder,
          account_number: values.account_number,
          account_type: values.account_type,
          is_active: true,
        })
        .eq('id', account.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      setAccount(data || values);
      return data || values;
    } else {
      const { data, error } = await supabase
        .from('favoron_bank_accounts')
        .insert({
          bank_name: values.bank_name,
          account_holder: values.account_holder,
          account_number: values.account_number,
          account_type: values.account_type,
          is_active: true,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      setAccount(data || values);
      return data || values;
    }
  }, [account]);

  return { account, loading, error, refresh: fetchAccount, saveAccount };
}

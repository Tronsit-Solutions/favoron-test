import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FinancialData {
  id: string;
  user_id: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
  bank_account_type: string | null;
  bank_swift_code: string | null;
  document_type: string | null;
  document_number: string | null;
  created_at: string;
  updated_at: string;
}

export const useFinancialData = () => {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancialData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_financial_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setFinancialData(data);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateFinancialData = async (updates: Partial<Omit<FinancialData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;

    try {
      if (financialData) {
        // Update existing record
        const { data, error } = await supabase
          .from('user_financial_data')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setFinancialData(data);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('user_financial_data')
          .insert({
            user_id: user.id,
            ...updates
          })
          .select()
          .single();

        if (error) throw error;
        setFinancialData(data);
      }
    } catch (err) {
      console.error('Error updating financial data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [user]);

  return {
    financialData,
    loading,
    error,
    updateFinancialData,
    refetchFinancialData: fetchFinancialData
  };
};
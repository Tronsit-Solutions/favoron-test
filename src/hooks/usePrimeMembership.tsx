import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useFavoronBankingInfo } from './useFavoronCompanyInfo';

export type PrimeMembership = {
  id?: string;
  user_id: string;
  amount: number;
  status: string;
  receipt_url?: string;
  receipt_filename?: string;
  bank_name: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_account_type: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  approved_at?: string;
  expires_at?: string;
  approved_by?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
};

export function usePrimeMembership() {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [memberships, setMemberships] = useState<PrimeMembership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { account: favoronAccount, loading: bankingLoading } = useFavoronBankingInfo();

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prime_memberships')
        .select('*, profiles!user_id(first_name, last_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemberships(data || []);
    } catch (err: any) {
      console.error('Error fetching prime memberships:', err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las membresías Prime",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const createPrimeMembership = useCallback(async (
    receiptFile: File,
    notes?: string
  ): Promise<PrimeMembership | null> => {
    if (!favoronAccount) {
      throw new Error('No se encontró información bancaria de Favorón');
    }

    setIsCreating(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no autenticado');

      // Upload receipt file
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}-prime-receipt-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(uploadData.path);

      // Create prime membership record
      const membershipData = {
        user_id: user.id,
        amount: 200, // Fixed amount for Prime membership
        status: 'pending' as const,
        receipt_url: publicUrl,
        receipt_filename: receiptFile.name,
        bank_name: favoronAccount.bank_name,
        bank_account_holder: favoronAccount.account_holder,
        bank_account_number: favoronAccount.account_number,
        bank_account_type: favoronAccount.account_type,
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from('prime_memberships')
        .insert(membershipData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de membresía Prime ha sido enviada exitosamente",
      });

      // Refresh memberships list
      await fetchMemberships();
      
      return data;
    } catch (err: any) {
      console.error('Error creating prime membership:', err);
      toast({
        title: "Error",
        description: err.message || "Error al crear la solicitud de membresía Prime",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [favoronAccount, toast, fetchMemberships]);

  const updateMembershipStatus = useCallback(async (
    membershipId: string, 
    status: 'approved' | 'rejected',
    notes?: string,
    adminId?: string
  ) => {
    try {
      const updateData: any = {
        status,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      };

      if (adminId) {
        updateData.approved_by = adminId;
      }

      const { error } = await supabase
        .from('prime_memberships')
        .update(updateData)
        .eq('id', membershipId);

      if (error) throw error;

      toast({
        title: status === 'approved' ? "Membresía aprobada" : "Membresía rechazada",
        description: status === 'approved' 
          ? "La membresía Prime ha sido aprobada exitosamente"
          : "La membresía Prime ha sido rechazada",
      });

      // Refresh memberships list
      await fetchMemberships();
    } catch (err: any) {
      console.error('Error updating membership status:', err);
      toast({
        title: "Error",
        description: "Error al actualizar el estado de la membresía",
        variant: "destructive",
      });
    }
  }, [toast, fetchMemberships]);

  return {
    memberships,
    loading,
    isCreating,
    favoronAccount,
    bankingLoading,
    createPrimeMembership,
    updateMembershipStatus,
    refresh: fetchMemberships,
  };
}
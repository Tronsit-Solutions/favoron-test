import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Package = Tables<'packages'>;
export type PackageInsert = TablesInsert<'packages'>;
export type PackageUpdate = TablesUpdate<'packages'>;

export const usePackagesData = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            username,
            email,
            phone_number,
            bank_name,
            bank_account_number,
            bank_account_holder,
            bank_account_type,
            trust_level
          ),
          trips:matched_trip_id (
            id,
            package_receiving_address,
            arrival_date,
            first_day_packages,
            last_day_packages,
            delivery_date,
            from_city,
            to_city,
            profiles:user_id (
              id,
              first_name,
              last_name,
              username,
              email,
              phone_number,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      setPackages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async (packageData: PackageInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const insertData = {
        ...packageData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('packages')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      toast({
        title: "¡Éxito!",
        description: "Paquete creado correctamente",
      });
      
      // Immediate optimistic update instead of setTimeout
      fetchPackages();
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo crear el paquete: ${error.message}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePackage = async (id: string, updates: PackageUpdate) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Package not found or you do not have permission to update it');
      }
      
      setPackages(prev => {
        const updated = prev.map(pkg => 
          pkg.id === id ? { ...pkg, ...data } : pkg
        );
        return updated;
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo actualizar el paquete: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({
          status: 'cancelled',
          quote_expires_at: null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPackages(prev => prev.map(pkg => 
        pkg.id === id ? { ...pkg, ...data } : pkg
      ));
      
      toast({
        title: "Éxito",
        description: "Pedido cancelado y movido a historial",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cancelar el paquete",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPackages();

    // Set up real-time subscription
    const channel = supabase
      .channel('packages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packages'
        },
        (payload) => {
          // Immediate refetch for real-time updates
          fetchPackages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    packages,
    loading,
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages: fetchPackages
  };
};
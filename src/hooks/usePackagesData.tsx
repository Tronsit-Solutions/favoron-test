import { useState, useEffect } from 'react';
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
      console.log('🔄 Fetching packages...');
      
      // Debug: Check current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);
      
      // Debug: Check if user has admin role
      if (user) {
        const { data: roleData } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        console.log('🛡️ Has admin role:', roleData);
      }
      
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            username,
            email
          ),
          trips:matched_trip_id (
            id,
            package_receiving_address,
            departure_date,
            arrival_date,
            first_day_packages,
            last_day_packages,
            delivery_date,
            from_city,
            to_city
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('📦 Supabase query error:', error);
        throw error;
      }
      
      console.log('📦 Packages fetched:', data?.length || 0, 'packages');
      console.log('📦 Raw packages data:', data);
      setPackages(data || []);
    } catch (error: any) {
      console.error('Error fetching packages:', error);
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

      const { data, error } = await supabase
        .from('packages')
        .insert({
          ...packageData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Don't manually update state here - let real-time subscription handle it
      // This prevents duplicate entries
      toast({
        title: "¡Éxito!",
        description: "Paquete creado correctamente",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating package:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el paquete",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePackage = async (id: string, updates: PackageUpdate) => {
    try {
      console.log('🔄 UPDATING PACKAGE:', id, 'with updates:', updates);
      
      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Package updated successfully:', data);
      
      setPackages(prev => {
        const updated = prev.map(pkg => 
          pkg.id === id ? { ...pkg, ...data } : pkg
        );
        console.log('📦 Updated packages state:', updated.find(p => p.id === id));
        return updated;
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      toast({
        title: "Éxito",
        description: "Paquete eliminado correctamente",
      });
    } catch (error: any) {
      console.error('Error deleting package:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete",
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
          console.log('📦 Real-time update received:', payload);
          console.log('🔄 Fetching updated packages...');
          
          // Refetch all packages to ensure we have the latest data with profiles
          // This is more reliable than trying to merge real-time data without profiles
          fetchPackages();
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

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
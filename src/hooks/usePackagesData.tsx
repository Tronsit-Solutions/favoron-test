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
      console.log('⏰ Timestamp:', new Date().toISOString());
      
      // Debug: Check current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);
      console.log('👤 User object:', user);
      
      // Debug: Check if user has admin role
      if (user) {
        const { data: roleData, error: roleError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        console.log('🛡️ Has admin role:', roleData);
        console.log('🛡️ Role check error:', roleError);
      }
      
      // Debug: First, try a simple count query to see if there are any packages at all
      const { count, error: countError } = await supabase
        .from('packages')
        .select('*', { count: 'exact', head: true });
      
      console.log('📊 Total packages count:', count);
      console.log('📊 Count error:', countError);
      
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

      console.log('📦 Query executed');
      console.log('📦 Error from query:', error);
      console.log('📦 Data type:', typeof data);
      console.log('📦 Data array length:', Array.isArray(data) ? data.length : 'not array');

      if (error) {
        console.error('📦 Supabase query error:', error);
        throw error;
      }
      
      console.log('📦 Packages fetched:', data?.length || 0, 'packages');
      console.log('📦 Raw packages data:', data);
      
      // Debug: Check pending packages specifically
      const pendingPackages = data?.filter(p => p.status === 'pending_approval') || [];
      console.log('⏳ PENDING PACKAGES COUNT:', pendingPackages.length);
      console.log('⏳ PENDING PACKAGES DETAILS:', pendingPackages.map(p => ({
        id: p.id,
        description: p.item_description,
        status: p.status,
        user_id: p.user_id,
        created_at: p.created_at
      })));
      
      // Debug: Check SPECIFICALLY for admin user packages
      const adminUserId = '5e3c944e-9130-4ea7-8165-b8ec9d5abf6f';
      const adminPendingPackages = data?.filter(p => p.status === 'pending_approval' && p.user_id === adminUserId) || [];
      console.log('🔥 CRITICAL - ADMIN PENDING PACKAGES COUNT:', adminPendingPackages.length);
      console.log('🔥 CRITICAL - ADMIN PENDING PACKAGES:', adminPendingPackages);
      
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
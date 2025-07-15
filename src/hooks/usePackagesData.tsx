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
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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
          
          if (payload.eventType === 'INSERT') {
            console.log('🆕 New package inserted:', payload.new);
            setPackages(prev => {
              // Check if package already exists to avoid duplicates
              const exists = prev.find(pkg => pkg.id === payload.new.id);
              if (!exists) {
                return [payload.new as Package, ...prev];
              }
              return prev;
            });
          } else if (payload.eventType === 'UPDATE') {
            console.log('🔄 Package updated:', payload.new);
            setPackages(prev => prev.map(pkg => 
              pkg.id === payload.new.id ? { ...pkg, ...payload.new } : pkg
            ));
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ Package deleted:', payload.old);
            setPackages(prev => prev.filter(pkg => pkg.id !== payload.old.id));
          }
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
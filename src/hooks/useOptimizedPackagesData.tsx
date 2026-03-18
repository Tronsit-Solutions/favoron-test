import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCachedData } from '@/hooks/useCachedData';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { shouldRecalculateQuote, normalizeQuote } from '@/lib/quoteHelpers';

export type Package = Tables<'packages'>;
export type PackageInsert = TablesInsert<'packages'>;
export type PackageUpdate = TablesUpdate<'packages'>;

export const useOptimizedPackagesData = (userId?: string, rates?: { standard: number; prime: number }) => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // Track recent local mutations so realtime can skip redundant overwrites
  const recentMutationsRef = useRef<Record<string, number>>({});

  // Memoized query for basic package data
  const fetchBasicPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Separate query for profile data (only when needed)
  const fetchProfileData = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, username, avatar_url')
      .in('id', userIds);

    if (error) return {};
    
    return data.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
  }, []);

  // Separate query for trip data (only when needed)
  const fetchTripData = useCallback(async (tripIds: string[]) => {
    if (tripIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        package_receiving_address,
        arrival_date,
        first_day_packages,
        last_day_packages,
        delivery_date,
        from_city,
        to_city,
        user_id,
        profiles:user_id (
          id,
          first_name,
          last_name,
          username,
          email,
          phone_number
        )
      `)
      .in('id', tripIds);

    if (error) return {};
    
    return data.reduce((acc, trip) => {
      acc[trip.id] = trip;
      return acc;
    }, {} as Record<string, any>);
  }, []);

  // Optimized fetch function - excludes heavy JSONB fields for faster loading
  // Fetches packages owned by user AND packages assigned to user's trips (as traveler)
  const fetchPackagesOptimized = useCallback(async (): Promise<Package[]> => {
    if (!userId) {
      console.log('📦 No user ID provided, returning empty');
      return [];
    }

    console.log('📦 Fetching packages for user:', userId);
    
    try {
      // RLS policies handle filtering: user sees own packages + packages assigned to their trips
      // No need for .or() filter - RLS does: (user_id = auth.uid()) OR (matched_trip_id IN (SELECT trips.id FROM trips WHERE trips.user_id = auth.uid()))
      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          user_id,
          status,
          item_description,
          item_link,
          estimated_price,
          products_data,
          purchase_origin,
          package_destination,
          package_destination_country,
          matched_trip_id,
          created_at,
          updated_at,
          delivery_deadline,
          delivery_method,
          quote,
          quote_expires_at,
          matched_assignment_expires_at,
          label_number,
          incident_flag,
          rejection_reason,
          wants_requote,
          admin_assigned_tip,
          admin_rejection,
          quote_rejection,
          traveler_rejection,
          confirmed_delivery_address,
          traveler_address,
          matched_trip_dates,
          payment_receipt,
          purchase_confirmation,
          tracking_info,
          office_delivery,
          traveler_dismissed_at,
          traveler_confirmation,
          additional_notes,
          internal_notes,
          profiles:user_id(
            id,
            first_name,
            last_name,
            username,
            email,
            phone_number,
            avatar_url,
            trust_level
          ),
          trips:matched_trip_id(
            id,
            from_city,
            to_city,
            arrival_date,
            delivery_date,
            first_day_packages,
            last_day_packages,
            package_receiving_address,
            profiles:user_id(
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
        console.error('Error fetching packages:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los paquetes",
          variant: "destructive",
        });
        throw error;
      }

      console.log('📦 Fetched packages successfully:', data?.length || 0, '(owned + assigned to trips)');
      // Cast to Package[] - missing heavy fields will be loaded on-demand via usePackageDetails
      return (data || []) as unknown as Package[];
    } catch (error) {
      console.error('📦 Package fetch failed:', error);
      return [];
    }
  }, [toast, userId]);

  // Use cached data with 2-minute TTL
  const { 
    data: cachedPackages, 
    loading: cacheLoading, 
    error, 
    refresh: refreshCache,
    invalidate: invalidateCache 
  } = useCachedData(fetchPackagesOptimized, {
    key: `packages-optimized-${userId || 'default'}`,
    ttl: 120000, // 2 minutes
    enabled: !!userId
  });

  // Sync local state with cached data
  useEffect(() => {
    if (cachedPackages) {
      setPackages(cachedPackages);
    }
    setLoading(cacheLoading);
  }, [cachedPackages, cacheLoading]);

  const createPackage = useCallback(async (packageData: PackageInsert) => {
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

      if (error) throw error;
      
      toast({
        title: "¡Éxito!",
        description: "Paquete creado correctamente",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error creating package:', error);
      
      // Check if it's a phone number requirement error
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Phone number is required')) {
        toast({
          title: "WhatsApp requerido",
          description: "Necesitas un número de WhatsApp válido para solicitar paquetes. Ve a tu perfil para agregarlo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "No se pudo crear el paquete",
          variant: "destructive",
        });
      }
      throw error;
    }
  }, [toast]);

  const updatePackage = useCallback(async (id: string, updates: PackageUpdate) => {
    try {
      // Get current package data for trust level checking
      const currentPackage = packages.find(pkg => pkg.id === id);
      
      // Quote validation and normalization - SKIP if manually edited by admin
      if (updates.quote && currentPackage) {
        const isManuallyEdited = (updates.quote as any).manually_edited === true;
        
        if (isManuallyEdited) {
          console.log('✅ Quote was manually edited, preserving all values for package', id);
        } else {
          const shopperTrustLevel = (currentPackage as any).profiles?.trust_level || 'basic';
          const deliveryMethod = currentPackage.delivery_method || 'pickup';
          const destination = currentPackage.package_destination;
          
          // Check if the quote needs recalculation
          if (shouldRecalculateQuote(updates.quote, deliveryMethod, shopperTrustLevel, destination)) {
            console.warn('⚠️ Quote discrepancy detected for package', id, {
              provided: updates.quote,
              deliveryMethod,
              shopperTrustLevel,
              destination
            });
            
            // Normalize the quote to ensure consistency (with corrected deliveryFee)
            updates.quote = normalizeQuote(updates.quote, deliveryMethod, shopperTrustLevel, destination, rates) as any;
            console.log('🔧 Quote normalized:', updates.quote);
          }
        }
      }
      
      // Si el shopper ya no quiere el paquete, cancelarlo y desactivar re-cotización
      if (updates.rejection_reason === 'no_longer_want') {
        updates = {
          ...updates,
          status: 'cancelled',
          wants_requote: false,
        };
      }

      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Package not found or permission denied');

      // Mark this package as recently mutated locally (skip realtime for 2s)
      recentMutationsRef.current[id] = Date.now();

      // Actualización optimista
      setPackages(prev => prev.map(pkg => (pkg.id === id ? { ...pkg, ...data } : pkg)));

      // Mensaje apropiado
      if (updates.status === 'cancelled') {
        toast({
          title: 'Paquete cancelado',
          description: 'El paquete se ha movido a tu historial de cancelados.',
        });
      }

      return data;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `No se pudo actualizar el paquete: ${error.message}`,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deletePackage = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      
      toast({
        title: "Éxito",
        description: "Paquete eliminado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Memoized packages for performance
  const memoizedPackages = useMemo(() => packages, [packages]);

  // No useEffect for auto-fetching - we use cached data instead

  return {
    packages: memoizedPackages,
    loading,
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages: refreshCache,
    setPackages,
    invalidateCache,
    recentMutationsRef
  };
};

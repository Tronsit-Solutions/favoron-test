import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseISO } from 'date-fns';

// ============= Types =============

export interface ProductData {
  name?: string;
  itemDescription?: string;
  estimatedPrice?: string | number;
  quantity?: string | number;
  itemLink?: string;
  cancelled?: boolean;
  receivedAtOffice?: boolean;
  notArrived?: boolean;
}

export interface OperationsPackage {
  id: string;
  item_description: string;
  status: string;
  matched_trip_id: string | null;
  user_id: string;
  label_number: number | null;
  estimated_price: number | null;
  delivery_method: string | null;
  created_at: string;
  purchase_origin: string;
  package_destination: string;
  products_data: ProductData[] | null;
  confirmed_delivery_address: any;
  // Joined data
  shopper_name: string;
  traveler_name: string;
  traveler_phone: string | null;
  trip_from_city: string | null;
  trip_to_city: string | null;
  trip_arrival_date: string | null;
  trip_delivery_date: string | null;
  trip_status: string | null;
  trip_user_id: string | null;
}

export interface TripGroupPackage {
  id: string;
  item_description: string;
  status: string;
  shopper_name: string;
  label_number: number | null;
  estimated_price: number | null;
  products_data: ProductData[] | null;
}

export interface TripGroup {
  trip_id: string;
  traveler_name: string;
  traveler_phone: string | null;
  arrival_date: string;
  from_city: string;
  to_city: string;
  packages: TripGroupPackage[];
}

export interface TripWithPackages {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
  delivery_date: string;
  status: string;
  traveler_name: string;
  packages: {
    id: string;
    item_description: string;
    status: string;
    label_number: number | null;
    package_destination: string;
    confirmed_delivery_address?: any;
    products_data?: ProductData[];
  }[];
}

// ============= Hook =============

const CACHE_TTL_MS = 30000; // 30 seconds cache

export const useOperationsData = () => {
  const [allPackages, setAllPackages] = useState<OperationsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Fetch with retry logic for handling timeouts
  const fetchWithRetry = async (retries = 2): Promise<any[]> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Operations data fetch attempt ${attempt + 1}/${retries + 1}`);
        const { data, error } = await supabase.rpc('get_all_operations_data');
        
        if (error) {
          // Check if it's a timeout error
          if (error.code === '57014' || error.message?.includes('timeout')) {
            console.warn(`⏱️ Timeout on attempt ${attempt + 1}, ${retries - attempt} retries left`);
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
              continue;
            }
          }
          throw error;
        }
        
        return data || [];
      } catch (err) {
        if (attempt === retries) throw err;
        console.warn(`❌ Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    return [];
  };

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    // Skip fetch if data is fresh (less than 30 seconds old) and not forcing refresh
    if (!forceRefresh && lastFetched && Date.now() - lastFetched.getTime() < CACHE_TTL_MS) {
      console.log('⏭️ Operations data cache still fresh, skipping fetch');
      return;
    }

    // Only show loading spinner on initial load, not on refresh
    if (allPackages.length === 0) {
      setLoading(true);
    }

    try {
      const data = await fetchWithRetry(2);

      // Transform RPC response to our internal format
      const packages: OperationsPackage[] = data.map((row: any) => ({
        id: row.id,
        item_description: row.item_description,
        status: row.status,
        matched_trip_id: row.matched_trip_id,
        user_id: row.user_id,
        label_number: row.label_number,
        estimated_price: row.estimated_price,
        delivery_method: row.delivery_method,
        created_at: row.created_at,
        purchase_origin: row.purchase_origin,
        package_destination: row.package_destination,
        products_data: row.products_summary,
        confirmed_delivery_address: row.confirmed_delivery_address,
        shopper_name: `${row.shopper_first_name || ''} ${row.shopper_last_name || ''}`.trim() || 'Shopper desconocido',
        traveler_name: `${row.traveler_first_name || ''} ${row.traveler_last_name || ''}`.trim() || 'Viajero desconocido',
        traveler_phone: row.traveler_phone 
          ? `${row.traveler_country_code || ''}${row.traveler_phone}` 
          : null,
        trip_from_city: row.trip_from_city,
        trip_to_city: row.trip_to_city,
        trip_arrival_date: row.trip_arrival_date,
        trip_delivery_date: row.trip_delivery_date,
        trip_status: row.trip_status,
        trip_user_id: row.trip_user_id,
      }));

      setAllPackages(packages);
      setLastFetched(new Date());
      console.log(`✅ Operations data loaded: ${packages.length} packages`);
    } catch (error) {
      console.error('Error fetching operations data:', error);
      toast.error('Error al cargar datos de operaciones. Por favor recarga la página.');
    } finally {
      setLoading(false);
    }
  }, [lastFetched, allPackages.length]);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // ============= Filtered data for each tab (computed in memory) =============

  // Reception tab: in_transit, received_by_traveler, pending_office_confirmation
  const receptionPackages = useMemo(() => 
    allPackages.filter(p => 
      ['in_transit', 'received_by_traveler', 'pending_office_confirmation'].includes(p.status)
    ), [allPackages]);

  // Ready tab: delivered_to_office
  const readyPackages = useMemo(() => 
    allPackages.filter(p => p.status === 'delivered_to_office'), 
    [allPackages]);

  // Completed tab: ready_for_pickup, ready_for_delivery
  const completedPackages = useMemo(() => 
    allPackages.filter(p => 
      ['ready_for_pickup', 'ready_for_delivery'].includes(p.status)
    ), [allPackages]);

  // Labels tab: all packages with trips in approved/active status (derived from all data)
  const labelsTrips = useMemo((): TripWithPackages[] => {
    // Group by trip
    const tripMap = new Map<string, TripWithPackages>();
    
    allPackages.forEach(pkg => {
      if (!pkg.matched_trip_id || !pkg.trip_from_city) return;
      // Only include trips with approved/active status
      if (!['approved', 'active'].includes(pkg.trip_status || '')) return;
      
      if (!tripMap.has(pkg.matched_trip_id)) {
        tripMap.set(pkg.matched_trip_id, {
          id: pkg.matched_trip_id,
          from_city: pkg.trip_from_city || '',
          to_city: pkg.trip_to_city || '',
          arrival_date: pkg.trip_arrival_date || '',
          delivery_date: pkg.trip_delivery_date || '',
          status: pkg.trip_status || '',
          traveler_name: pkg.traveler_name,
          packages: [],
        });
      }
      
      tripMap.get(pkg.matched_trip_id)!.packages.push({
        id: pkg.id,
        item_description: pkg.item_description,
        status: pkg.status,
        label_number: pkg.label_number,
        package_destination: pkg.package_destination,
        confirmed_delivery_address: pkg.confirmed_delivery_address,
        products_data: pkg.products_data || undefined,
      });
    });

    return Array.from(tripMap.values())
      .filter(t => t.packages.length > 0)
      .sort((a, b) => {
        const dateA = a.arrival_date ? parseISO(a.arrival_date) : new Date();
        const dateB = b.arrival_date ? parseISO(b.arrival_date) : new Date();
        return dateA.getTime() - dateB.getTime();
      });
  }, [allPackages]);

  // Reception tab grouped by trip
  const receptionTripGroups = useMemo((): TripGroup[] => {
    const tripMap = new Map<string, TripGroup>();

    receptionPackages.forEach(pkg => {
      if (!pkg.matched_trip_id) return;

      if (!tripMap.has(pkg.matched_trip_id)) {
        tripMap.set(pkg.matched_trip_id, {
          trip_id: pkg.matched_trip_id,
          traveler_name: pkg.traveler_name,
          traveler_phone: pkg.traveler_phone,
          arrival_date: pkg.trip_arrival_date || '',
          from_city: pkg.trip_from_city || '',
          to_city: pkg.trip_to_city || '',
          packages: [],
        });
      }

      tripMap.get(pkg.matched_trip_id)!.packages.push({
        id: pkg.id,
        item_description: pkg.item_description,
        status: pkg.status,
        shopper_name: pkg.shopper_name,
        label_number: pkg.label_number,
        estimated_price: pkg.estimated_price,
        products_data: pkg.products_data,
      });
    });

    return Array.from(tripMap.values()).sort((a, b) => {
      const dateA = a.arrival_date ? parseISO(a.arrival_date) : new Date();
      const dateB = b.arrival_date ? parseISO(b.arrival_date) : new Date();
      return dateA.getTime() - dateB.getTime();
    });
  }, [receptionPackages]);

  // ============= Actions to update local state =============

  const removePackage = useCallback((packageId: string) => {
    setAllPackages(prev => prev.filter(p => p.id !== packageId));
  }, []);

  const removePackages = useCallback((packageIds: string[]) => {
    const idsSet = new Set(packageIds);
    setAllPackages(prev => prev.filter(p => !idsSet.has(p.id)));
  }, []);

  const updatePackageStatus = useCallback((packageId: string, newStatus: string) => {
    setAllPackages(prev => prev.map(p => 
      p.id === packageId ? { ...p, status: newStatus } : p
    ));
  }, []);

  // Force refresh wrapper for onClick handlers
  const refresh = useCallback(() => fetchAllData(true), [fetchAllData]);

  return {
    // Loading state
    loading,
    lastFetched,
    refresh,
    
    // All data
    allPackages,
    
    // Tab-specific filtered data
    receptionPackages,
    receptionTripGroups,
    readyPackages,
    completedPackages,
    labelsTrips,
    
    // State mutation helpers
    removePackage,
    removePackages,
    updatePackageStatus,
  };
};

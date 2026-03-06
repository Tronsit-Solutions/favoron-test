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
  incident_flag: boolean;
  incident_status: string | null;
  incident_history: any[];
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
  incident_flag: boolean;
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
  traveler_id: string;
  traveler_email?: string;
  traveler_phone?: string;
  available_space?: number;
  first_day_packages?: string;
  last_day_packages?: string;
  last_mile_delivered?: boolean;
  packages: {
    id: string;
    item_description: string;
    status: string;
    label_number: number | null;
    package_destination: string;
    confirmed_delivery_address?: any;
    products_data?: ProductData[];
    shopper_name: string;
    delivery_method?: string | null;
  }[];
}

// ============= Label Cart Types =============

export interface LabelCartItem {
  id: string;
  item_description: string;
  products_data: ProductData[] | null;
  confirmed_delivery_address: any;
  delivery_method: string | null;
  label_number: number | null;
  shopper_name: string;
  estimated_price: number | null;
  created_at: string;
  trip_from_city: string | null;
  trip_to_city: string | null;
  traveler_name: string;
}

export interface LabelBatch {
  id: string;
  createdAt: string;
  items: LabelCartItem[];
}

// ============= localStorage helpers =============

const CART_STORAGE_KEY = 'ops_label_cart';
const HISTORY_STORAGE_KEY = 'ops_label_history';
const MAX_HISTORY_BATCHES = 20;

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable – ignore
  }
}

// ============= Hook =============

const CACHE_TTL_MS = 30000; // 30 seconds cache

export const useOperationsData = () => {
  const [allPackages, setAllPackages] = useState<OperationsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [labelCart, setLabelCart] = useState<LabelCartItem[]>(() => readFromStorage(CART_STORAGE_KEY, []));
  const [labelHistory, setLabelHistory] = useState<LabelBatch[]>(() => readFromStorage(HISTORY_STORAGE_KEY, []));

  // Sync cart to localStorage
  useEffect(() => {
    writeToStorage(CART_STORAGE_KEY, labelCart);
  }, [labelCart]);

  // Sync history to localStorage
  useEffect(() => {
    writeToStorage(HISTORY_STORAGE_KEY, labelHistory);
  }, [labelHistory]);

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
        incident_flag: row.incident_flag || false,
        incident_status: row.incident_status || (row.incident_flag ? 'active' : null),
        incident_history: row.incident_history || [],
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
      ['in_transit', 'received_by_traveler', 'pending_office_confirmation'].includes(p.status) && !p.incident_flag
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

  // Incidents tab: all packages with incident_flag === true
  const incidentPackages = useMemo(() => 
    allPackages.filter(p => p.incident_flag === true), 
    [allPackages]);

  // Labels tab: only packages in ACTIVE processing states (not completed/cancelled)
  // Fetches additional trip data from DB for last_mile_delivered status
  const [labelsTripsData, setLabelsTripsData] = useState<Map<string, { last_mile_delivered: boolean; available_space: number | null; first_day_packages: string | null; last_day_packages: string | null }>>(new Map());
  
  // Fetch additional trip data when we have trips
  useEffect(() => {
    const fetchTripData = async () => {
      const tripIds = [...new Set(allPackages.filter(p => p.matched_trip_id).map(p => p.matched_trip_id!))];
      if (tripIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('trips')
        .select('id, last_mile_delivered, available_space, first_day_packages, last_day_packages')
        .in('id', tripIds);
      
      if (!error && data) {
        const map = new Map<string, { last_mile_delivered: boolean; available_space: number | null; first_day_packages: string | null; last_day_packages: string | null }>();
        data.forEach(trip => {
          map.set(trip.id, {
            last_mile_delivered: trip.last_mile_delivered || false,
            available_space: trip.available_space,
            first_day_packages: trip.first_day_packages,
            last_day_packages: trip.last_day_packages,
          });
        });
        setLabelsTripsData(map);
      }
    };
    
    fetchTripData();
  }, [allPackages]);

  const labelsTrips = useMemo((): TripWithPackages[] => {
    // Only include packages that actually need labels (active processing states)
    const activePackageStatuses = [
      'paid', 'pending_purchase', 'purchased', 'in_transit', 
      'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office'
    ];
    
    // Group by trip
    const tripMap = new Map<string, TripWithPackages>();
    
    allPackages.forEach(pkg => {
      if (!pkg.matched_trip_id || !pkg.trip_from_city) return;
      // Only include trips with approved/active status
      if (!['approved', 'active'].includes(pkg.trip_status || '')) return;
      // Only include packages in active processing states
      if (!activePackageStatuses.includes(pkg.status)) return;
      
      const tripExtra = labelsTripsData.get(pkg.matched_trip_id);
      
      if (!tripMap.has(pkg.matched_trip_id)) {
        tripMap.set(pkg.matched_trip_id, {
          id: pkg.matched_trip_id,
          from_city: pkg.trip_from_city || '',
          to_city: pkg.trip_to_city || '',
          arrival_date: pkg.trip_arrival_date || '',
          delivery_date: pkg.trip_delivery_date || '',
          status: pkg.trip_status || '',
          traveler_name: pkg.traveler_name,
          traveler_id: pkg.trip_user_id || '',
          traveler_phone: pkg.traveler_phone || undefined,
          available_space: tripExtra?.available_space || undefined,
          first_day_packages: tripExtra?.first_day_packages || undefined,
          last_day_packages: tripExtra?.last_day_packages || undefined,
          last_mile_delivered: tripExtra?.last_mile_delivered || false,
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
        shopper_name: pkg.shopper_name,
        delivery_method: pkg.delivery_method,
      });
    });

    return Array.from(tripMap.values())
      .filter(t => t.packages.length > 0)
      .sort((a, b) => {
        const dateA = a.arrival_date ? parseISO(a.arrival_date) : new Date();
        const dateB = b.arrival_date ? parseISO(b.arrival_date) : new Date();
        return dateA.getTime() - dateB.getTime();
      });
  }, [allPackages, labelsTripsData]);

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
        incident_flag: pkg.incident_flag,
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

  const updatePackageIncidentFlag = useCallback((packageId: string, incidentFlag: boolean, incidentStatus?: string | null, incidentHistory?: any[]) => {
    setAllPackages(prev => prev.map(p => 
      p.id === packageId ? { 
        ...p, 
        incident_flag: incidentFlag,
        ...(incidentStatus !== undefined ? { incident_status: incidentStatus } : {}),
        ...(incidentHistory !== undefined ? { incident_history: incidentHistory } : {}),
      } : p
    ));
  }, []);

  // ============= Label Cart Actions =============

  const addToLabelCart = useCallback(async (packageId: string) => {
    // Find package data from local state
    const pkg = allPackages.find(p => p.id === packageId);
    if (!pkg) return;

    // Fetch fresh label_number from DB (assigned by the RPC)
    const { data } = await supabase
      .from('packages')
      .select('label_number')
      .eq('id', packageId)
      .maybeSingle();

    const item: LabelCartItem = {
      id: pkg.id,
      item_description: pkg.item_description,
      products_data: pkg.products_data,
      confirmed_delivery_address: pkg.confirmed_delivery_address,
      delivery_method: pkg.delivery_method,
      label_number: data?.label_number ?? pkg.label_number ?? null,
      shopper_name: pkg.shopper_name,
      estimated_price: pkg.estimated_price,
      created_at: pkg.created_at,
      trip_from_city: pkg.trip_from_city,
      trip_to_city: pkg.trip_to_city,
      traveler_name: pkg.traveler_name,
    };

    setLabelCart(prev => [...prev, item]);
  }, [allPackages]);

  const addManyToLabelCart = useCallback(async (packageIds: string[]) => {
    if (packageIds.length === 0) return;

    // Fetch fresh label_numbers from DB
    const { data: labelData } = await supabase
      .from('packages')
      .select('id, label_number')
      .in('id', packageIds);

    const labelMap = new Map<string, number | null>();
    labelData?.forEach(row => labelMap.set(row.id, row.label_number));

    const items: LabelCartItem[] = packageIds
      .map(id => {
        const pkg = allPackages.find(p => p.id === id);
        if (!pkg) return null;
        return {
          id: pkg.id,
          item_description: pkg.item_description,
          products_data: pkg.products_data,
          confirmed_delivery_address: pkg.confirmed_delivery_address,
          delivery_method: pkg.delivery_method,
          label_number: labelMap.get(id) ?? pkg.label_number ?? null,
          shopper_name: pkg.shopper_name,
          estimated_price: pkg.estimated_price,
          created_at: pkg.created_at,
          trip_from_city: pkg.trip_from_city,
          trip_to_city: pkg.trip_to_city,
          traveler_name: pkg.traveler_name,
        } as LabelCartItem;
      })
      .filter(Boolean) as LabelCartItem[];

    setLabelCart(prev => [...prev, ...items]);
  }, [allPackages]);

  const clearLabelCart = useCallback(() => {
    // Move current cart to history before clearing
    setLabelCart(prev => {
      if (prev.length > 0) {
        const batch: LabelBatch = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          items: prev,
        };
        setLabelHistory(h => [batch, ...h].slice(0, MAX_HISTORY_BATCHES));
      }
      return [];
    });
  }, []);

  const removeFromLabelCart = useCallback((packageId: string) => {
    setLabelCart(prev => prev.filter(item => item.id !== packageId));
  }, []);

  const restoreFromHistory = useCallback((batchId: string) => {
    const batch = labelHistory.find(b => b.id === batchId);
    if (batch) {
      setLabelCart(batch.items);
    }
  }, [labelHistory]);

  const deleteFromHistory = useCallback((batchId: string) => {
    setLabelHistory(prev => prev.filter(b => b.id !== batchId));
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
    incidentPackages,
    labelsTrips,
    
    // State mutation helpers
    removePackage,
    removePackages,
    updatePackageStatus,
    updatePackageIncidentFlag,
    
    // Label cart
    labelCart,
    addToLabelCart,
    addManyToLabelCart,
    clearLabelCart,
    removeFromLabelCart,
    
    // Label history
    labelHistory,
    restoreFromHistory,
    deleteFromHistory,
  };
};

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  type: 'trip' | 'package';
  userId: string;
  userName: string;
  userPhone: string | null;
  userEmail: string | null;
  acquisitionChannel: string | null;
  description: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  statusColor: 'success' | 'warning' | 'destructive' | 'default' | 'secondary';
  
  // Trip-specific
  confirmedPackages?: number;
  completedPackages?: number;
  hasPendingPayment?: boolean;
  arrivalDate?: string;
  confirmedPackageDescriptions?: string[];
  fullPackageDescriptions?: string[];
  
  // Package-specific
  amount?: number;
  paid?: boolean;
  fullDescription?: string;
}

interface TripData {
  id: string;
  from_city: string;
  to_city: string;
  status: string;
  created_at: string;
  user_id: string;
  arrival_date: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    email: string | null;
    acquisition_source: string | null;
  };
}

interface PackageData {
  id: string;
  item_description: string;
  status: string;
  created_at: string;
  user_id: string;
  quote: unknown;
  matched_trip_id: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    phone_number: string | null;
    email: string | null;
    acquisition_source: string | null;
  };
}

interface AccumulatorData {
  trip_id: string;
  payment_order_created: boolean;
}

export type ActivityFilter = 'all' | 'trips' | 'packages';
export type StatusFilter = 'all' | 'completed' | 'cancelled' | 'in_progress' | 'paid' | 'unpaid';

const PAID_STATUSES = [
  'payment_confirmed',
  'pending_purchase',
  'in_transit',
  'received_by_traveler',
  'pending_office_confirmation',
  'delivered_to_office',
  'completed'
];

const CANCELLED_STATUSES = ['cancelled', 'quote_rejected', 'admin_rejected'];

// Helper function to fetch all rows bypassing the 1000 row limit
async function fetchAllPaginated<T>(
  buildQuery: () => ReturnType<typeof supabase.from>,
  batchSize: number = 1000
): Promise<T[]> {
  const allData: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await buildQuery().range(offset, offset + batchSize - 1);
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData.push(...(data as T[]));
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  return allData;
}

export function useActivityTimeline(
  typeFilter: ActivityFilter = 'all',
  statusFilter: StatusFilter = 'all',
  searchQuery: string = '',
  dateRange: { from: Date | null; to: Date | null } = { from: null, to: null }
) {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [accumulators, setAccumulators] = useState<AccumulatorData[]>([]);
  const [packageCounts, setPackageCounts] = useState<Record<string, { confirmed: number; completed: number; descriptions: string[]; fullDescriptions: string[] }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch trips with profiles (paginated)
        const tripsData = await fetchAllPaginated<TripData>(
          () => supabase
            .from('trips')
            .select(`
              id, from_city, to_city, status, created_at, user_id, arrival_date,
              profiles!trips_user_id_fkey (first_name, last_name, phone_number, email, acquisition_source)
            `)
            .not('status', 'in', '("pending_approval","rejected")')
            .order('created_at', { ascending: false })
        );
        
        // Fetch packages with profiles (paginated)
        const packagesData = await fetchAllPaginated<PackageData>(
          () => supabase
            .from('packages')
            .select(`
              id, item_description, status, created_at, user_id, quote, matched_trip_id,
              profiles!packages_user_id_fkey (first_name, last_name, phone_number, email, acquisition_source)
            `)
            .not('status', 'eq', 'pending_approval')
            .order('created_at', { ascending: false })
        );
        
        // Fetch trip payment accumulators (paginated)
        const accumulatorsData = await fetchAllPaginated<AccumulatorData>(
          () => supabase
            .from('trip_payment_accumulator')
            .select('trip_id, payment_order_created')
        );
        
        // Calculate package counts and descriptions per trip
        const counts: Record<string, { confirmed: number; completed: number; descriptions: string[]; fullDescriptions: string[] }> = {};
        (packagesData || []).forEach((pkg: PackageData) => {
          if (pkg.matched_trip_id) {
            if (!counts[pkg.matched_trip_id]) {
              counts[pkg.matched_trip_id] = { confirmed: 0, completed: 0, descriptions: [], fullDescriptions: [] };
            }
            if (PAID_STATUSES.includes(pkg.status)) {
              counts[pkg.matched_trip_id].confirmed++;
              const desc = pkg.item_description || 'Sin descripción';
              counts[pkg.matched_trip_id].descriptions.push(
                desc.substring(0, 30) + (desc.length > 30 ? '...' : '')
              );
              counts[pkg.matched_trip_id].fullDescriptions.push(desc);
            }
            if (pkg.status === 'completed') {
              counts[pkg.matched_trip_id].completed++;
            }
          }
        });
        
        setTrips(tripsData || []);
        setPackages(packagesData || []);
        setAccumulators(accumulatorsData || []);
        setPackageCounts(counts);
      } catch (err) {
        console.error('Error fetching activity timeline:', err);
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const activities = useMemo(() => {
    const items: ActivityItem[] = [];
    
    // Process trips
    if (typeFilter === 'all' || typeFilter === 'trips') {
      trips.forEach(trip => {
        const accumulator = accumulators.find(a => a.trip_id === trip.id);
        const counts = packageCounts[trip.id] || { confirmed: 0, completed: 0, descriptions: [], fullDescriptions: [] };
        const hasPendingPayment = counts.confirmed > 0 && !accumulator?.payment_order_created;
        
        let statusLabel: string;
        let statusColor: ActivityItem['statusColor'];
        
        if (trip.status === 'completed' && accumulator?.payment_order_created) {
          statusLabel = 'Completado y Pagado';
          statusColor = 'success';
        } else if (trip.status === 'completed' && hasPendingPayment) {
          statusLabel = 'Completado - Pago Pendiente';
          statusColor = 'warning';
        } else if (counts.confirmed > 0) {
          statusLabel = 'Con paquetes asignados';
          statusColor = 'default';
        } else if (trip.status === 'approved') {
          statusLabel = 'Aprobado - Sin paquetes';
          statusColor = 'secondary';
        } else {
          statusLabel = trip.status;
          statusColor = 'secondary';
        }
        
        items.push({
          id: trip.id,
          type: 'trip',
          userId: trip.user_id,
          userName: `${trip.profiles?.first_name || ''} ${trip.profiles?.last_name || ''}`.trim() || 'Sin nombre',
          userPhone: trip.profiles?.phone_number || null,
          userEmail: trip.profiles?.email || null,
          acquisitionChannel: trip.profiles?.acquisition_source || null,
          description: `${trip.from_city} → ${trip.to_city}`,
          createdAt: trip.created_at,
          status: trip.status,
          statusLabel,
          statusColor,
          confirmedPackages: counts.confirmed,
          completedPackages: counts.completed,
          hasPendingPayment,
          arrivalDate: trip.arrival_date,
          confirmedPackageDescriptions: counts.descriptions || [],
          fullPackageDescriptions: counts.fullDescriptions || []
        });
      });
    }
    
    // Process packages
    if (typeFilter === 'all' || typeFilter === 'packages') {
      packages.forEach(pkg => {
        const isPaid = PAID_STATUSES.includes(pkg.status);
        const isCancelled = CANCELLED_STATUSES.includes(pkg.status);
        const quote = pkg.quote as { totalPrice?: number } | null;
        const amount = quote?.totalPrice || 0;
        
        let statusLabel: string;
        let statusColor: ActivityItem['statusColor'];
        
        if (pkg.status === 'completed') {
          statusLabel = 'Completado';
          statusColor = 'success';
        } else if (isCancelled) {
          statusLabel = 'Cancelado';
          statusColor = 'destructive';
        } else if (isPaid) {
          statusLabel = 'Pagado - En proceso';
          statusColor = 'default';
        } else if (pkg.status === 'quote_accepted') {
          statusLabel = 'Cotización aceptada - No ha pagado';
          statusColor = 'warning';
        } else if (pkg.status === 'quote_sent') {
          statusLabel = 'Cotización enviada';
          statusColor = 'secondary';
        } else if (pkg.status === 'pending_quote') {
          statusLabel = 'Pendiente cotización';
          statusColor = 'secondary';
        } else {
          statusLabel = pkg.status;
          statusColor = 'secondary';
        }
        
        items.push({
          id: pkg.id,
          type: 'package',
          userId: pkg.user_id,
          userName: `${pkg.profiles?.first_name || ''} ${pkg.profiles?.last_name || ''}`.trim() || 'Sin nombre',
          userPhone: pkg.profiles?.phone_number || null,
          userEmail: pkg.profiles?.email || null,
          acquisitionChannel: pkg.profiles?.acquisition_source || null,
          description: pkg.item_description?.substring(0, 50) + (pkg.item_description?.length > 50 ? '...' : ''),
          fullDescription: pkg.item_description || '',
          createdAt: pkg.created_at,
          status: pkg.status,
          statusLabel,
          statusColor,
          amount,
          paid: isPaid
        });
      });
    }
    
    // Apply status filter
    let filtered = items;
    if (statusFilter !== 'all') {
      filtered = items.filter(item => {
        if (statusFilter === 'completed') {
          return item.status === 'completed' || (item.type === 'trip' && item.statusLabel.includes('Completado'));
        }
        if (statusFilter === 'cancelled') {
          return CANCELLED_STATUSES.includes(item.status);
        }
        if (statusFilter === 'in_progress') {
          return !['completed', ...CANCELLED_STATUSES].includes(item.status) && 
                 !(item.type === 'trip' && item.statusLabel.includes('Completado'));
        }
        if (statusFilter === 'paid') {
          if (item.type === 'package') return item.paid;
          if (item.type === 'trip') return !item.hasPendingPayment && (item.confirmedPackages || 0) > 0;
        }
        if (statusFilter === 'unpaid') {
          if (item.type === 'package') return !item.paid && !CANCELLED_STATUSES.includes(item.status);
          if (item.type === 'trip') return item.hasPendingPayment;
        }
        return true;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.userName.toLowerCase().includes(query) ||
        item.userPhone?.toLowerCase().includes(query) ||
        item.userEmail?.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }
    
    // Apply date filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt);
        if (dateRange.from && itemDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (itemDate > endOfDay) return false;
        }
        return true;
      });
    }
    
    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [trips, packages, accumulators, packageCounts, typeFilter, statusFilter, searchQuery, dateRange]);

  return {
    activities,
    isLoading,
    error,
    stats: {
      totalTrips: trips.length,
      totalPackages: packages.length,
      totalActivities: activities.length
    }
  };
}

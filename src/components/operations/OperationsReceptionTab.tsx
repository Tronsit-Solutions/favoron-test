import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { parseISO } from 'date-fns';
import OperationsTripCard from './OperationsTripCard';

interface ProductData {
  itemDescription?: string;
  estimatedPrice?: string | number;
  quantity?: string | number;
  itemLink?: string;
}

interface PackageData {
  id: string;
  item_description: string;
  status: string;
  matched_trip_id: string;
  user_id: string;
  label_number: number | null;
  estimated_price: number | null;
  products_data: ProductData[] | null;
}

interface TripData {
  id: string;
  arrival_date: string;
  from_city: string;
  to_city: string;
  user_id: string;
}

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  country_code: string | null;
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

const OperationsReceptionTab = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch packages in reception-pending states
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('id, item_description, status, matched_trip_id, user_id, label_number, estimated_price, products_data')
        .in('status', ['in_transit', 'received_by_traveler', 'pending_office_confirmation'])
        .not('matched_trip_id', 'is', null)
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;

      if (!packagesData || packagesData.length === 0) {
        setPackages([]);
        setTrips([]);
        setProfiles(new Map());
        setLoading(false);
        return;
      }

      // Get unique trip IDs
      const tripIds = [...new Set(packagesData.map(p => p.matched_trip_id).filter(Boolean))] as string[];

      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, arrival_date, from_city, to_city, user_id')
        .in('id', tripIds);

      if (tripsError) throw tripsError;

      // Get unique user IDs (shoppers + travelers)
      const shopperIds = packagesData.map(p => p.user_id);
      const travelerIds = tripsData?.map(t => t.user_id) || [];
      const allUserIds = [...new Set([...shopperIds, ...travelerIds])];

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, phone_number, country_code')
        .in('id', allUserIds);

      if (profilesError) throw profilesError;

      // Build profiles map
      const profilesMap = new Map<string, ProfileData>();
      profilesData?.forEach(p => profilesMap.set(p.id, p));

      setPackages(packagesData as PackageData[]);
      setTrips(tripsData || []);
      setProfiles(profilesMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group packages by trip and sort by arrival date
  const tripGroups = useMemo((): TripGroup[] => {
    const tripsMap = new Map<string, TripData>();
    trips.forEach(t => tripsMap.set(t.id, t));

    const grouped = new Map<string, TripGroup>();

    packages.forEach(pkg => {
      if (!pkg.matched_trip_id) return;

      const trip = tripsMap.get(pkg.matched_trip_id);
      if (!trip) return;

      const travelerProfile = profiles.get(trip.user_id);
      const shopperProfile = profiles.get(pkg.user_id);

      const travelerName = travelerProfile
        ? `${travelerProfile.first_name || ''} ${travelerProfile.last_name || ''}`.trim()
        : 'Viajero desconocido';

      const travelerPhone = travelerProfile?.phone_number
        ? `${travelerProfile.country_code || ''}${travelerProfile.phone_number}`
        : null;

      const shopperName = shopperProfile
        ? `${shopperProfile.first_name || ''} ${shopperProfile.last_name || ''}`.trim()
        : 'Shopper desconocido';

      if (!grouped.has(trip.id)) {
        grouped.set(trip.id, {
          trip_id: trip.id,
          traveler_name: travelerName,
          traveler_phone: travelerPhone,
          arrival_date: trip.arrival_date,
          from_city: trip.from_city,
          to_city: trip.to_city,
          packages: [],
        });
      }

      grouped.get(trip.id)!.packages.push({
        id: pkg.id,
        item_description: pkg.item_description,
        status: pkg.status,
        shopper_name: shopperName,
        label_number: pkg.label_number,
        estimated_price: pkg.estimated_price,
        products_data: pkg.products_data as ProductData[] | null,
      });
    });

    // Sort by arrival date (overdue first, then today, then future)
    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = parseISO(a.arrival_date);
      const dateB = parseISO(b.arrival_date);
      return dateA.getTime() - dateB.getTime();
    });
  }, [packages, trips, profiles]);

  const handleConfirmPackage = async (packageId: string) => {
    if (!user) return;

    setConfirmingIds(prev => new Set(prev).add(packageId));
    try {
      const { error } = await supabase.rpc('admin_confirm_office_delivery', {
        _package_id: packageId,
        _admin_id: user.id,
      });

      if (error) throw error;

      toast.success('Paquete confirmado');
      
      // Remove package from local state
      setPackages(prev => prev.filter(p => p.id !== packageId));
    } catch (error: any) {
      console.error('Error confirming package:', error);
      toast.error(error.message || 'Error al confirmar');
    } finally {
      setConfirmingIds(prev => {
        const next = new Set(prev);
        next.delete(packageId);
        return next;
      });
    }
  };

  const handleConfirmAll = async (packageIds: string[]) => {
    if (!user || packageIds.length === 0) return;

    // Add all to confirming set
    setConfirmingIds(prev => {
      const next = new Set(prev);
      packageIds.forEach(id => next.add(id));
      return next;
    });

    const confirmed: string[] = [];
    const failed: string[] = [];

    // Confirm one by one (could be optimized with a batch RPC in the future)
    for (const packageId of packageIds) {
      try {
        const { error } = await supabase.rpc('admin_confirm_office_delivery', {
          _package_id: packageId,
          _admin_id: user.id,
        });

        if (error) {
          failed.push(packageId);
        } else {
          confirmed.push(packageId);
        }
      } catch {
        failed.push(packageId);
      }
    }

    // Remove confirmed packages from local state
    if (confirmed.length > 0) {
      setPackages(prev => prev.filter(p => !confirmed.includes(p.id)));
      toast.success(`${confirmed.length} paquete${confirmed.length !== 1 ? 's' : ''} confirmado${confirmed.length !== 1 ? 's' : ''}`);
    }

    if (failed.length > 0) {
      toast.error(`${failed.length} paquete${failed.length !== 1 ? 's' : ''} no se pudo${failed.length !== 1 ? 'ieron' : ''} confirmar`);
    }

    // Clear confirming set
    setConfirmingIds(prev => {
      const next = new Set(prev);
      packageIds.forEach(id => next.delete(id));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tripGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay paquetes pendientes</h3>
          <p className="text-muted-foreground">
            Todos los paquetes han sido procesados.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalPackages = tripGroups.reduce((sum, t) => sum + t.packages.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {tripGroups.length} viaje{tripGroups.length !== 1 ? 's' : ''} con {totalPackages} paquete{totalPackages !== 1 ? 's' : ''} pendiente{totalPackages !== 1 ? 's' : ''}
        </h2>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <div className="space-y-4">
        {tripGroups.map((trip) => (
          <OperationsTripCard
            key={trip.trip_id}
            trip={trip}
            onConfirmPackage={handleConfirmPackage}
            onConfirmAll={handleConfirmAll}
            confirmingIds={confirmingIds}
          />
        ))}
      </div>
    </div>
  );
};

export default OperationsReceptionTab;

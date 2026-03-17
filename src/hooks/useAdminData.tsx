import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { useUnreadChatMessages } from '@/hooks/useUnreadChatMessages';

export type Package = Tables<'packages'>;
export type Trip = Tables<'trips'>;

// Lightweight package for admin list views - heavy JSONB fields are optional and loaded on-demand
export type LightweightPackage = Package & {
  profiles?: any; // Enriched from separate query
};

interface AdminData {
  packages: LightweightPackage[];
  trips: Trip[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  loadMorePackages: () => Promise<void>;
  hasMorePackages: boolean;
  totalPackages: number;
  unreadCounts: { [packageId: string]: number };
  markPackageMessagesAsRead: (packageId: string) => Promise<void>;
  autoApprovedPayments: LightweightPackage[];
  approvedPaymentsData: LightweightPackage[];
  autoApprovedPaymentsLoading: boolean;
  approvedPaymentsLoading: boolean;
  loadAutoApprovedPayments: () => Promise<void>;
  loadApprovedPayments: () => Promise<void>;
}

export const useAdminData = (): AdminData => {
  const [packages, setPackages] = useState<LightweightPackage[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packagesOffset, setPackagesOffset] = useState(0);
  const [totalPackages, setTotalPackages] = useState(0);
  const [hasMorePackages, setHasMorePackages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [autoApprovedPayments, setAutoApprovedPayments] = useState<LightweightPackage[]>([]);
  const [approvedPaymentsData, setApprovedPaymentsData] = useState<LightweightPackage[]>([]);
  const [autoApprovedPaymentsLoading, setAutoApprovedPaymentsLoading] = useState(false);
  const [approvedPaymentsLoading, setApprovedPaymentsLoading] = useState(false);
  const { toast } = useToast();
  const { user, userRole, loading: authLoading } = useAuth();
  const { unreadCounts, markPackageMessagesAsRead } = useUnreadChatMessages();

  const PACKAGES_PER_PAGE = 50;

  // Persistir estado admin para evitar pérdida temporal durante refresh
  const [wasAdmin, setWasAdmin] = useState(() => {
    try {
      return localStorage.getItem('temp_admin_state') === 'true';
    } catch {
      return false;
    }
  });

  const isAdmin = useMemo(() => {
    const currentlyAdmin = userRole?.role === 'admin';
    
    console.log('🔑 Admin check:', {
      userRole,
      currentlyAdmin,
      authLoading,
      wasAdmin,
      userId: user?.id
    });
    
    if (currentlyAdmin) {
      setWasAdmin(true);
      try {
        localStorage.setItem('temp_admin_state', 'true');
      } catch {}
    } else if (!authLoading && userRole) {
      setWasAdmin(false);
      try {
        localStorage.removeItem('temp_admin_state');
      } catch {}
    }
    
    return currentlyAdmin;
  }, [userRole, authLoading, user, wasAdmin]);

  const fetchAdminPackages = useCallback(async (offset: number = 0, append: boolean = false) => {
    try {
      console.log('🔄 Admin: Fetching packages (DIRECT QUERY)...', { offset, limit: PACKAGES_PER_PAGE, append });
      
      // Optimized query: only essential lightweight fields (no heavy JSONB)
      const { data: packagesData, error: packagesError, count } = await supabase
        .from('packages')
        .select(`
          id, user_id, status, item_description, estimated_price,
          purchase_origin, package_destination, package_destination_country, matched_trip_id,
          created_at, updated_at, delivery_deadline, quote_expires_at,
          matched_assignment_expires_at, label_number, incident_flag,
          delivery_method, quote, rejection_reason, wants_requote,
          admin_rejection, quote_rejection, traveler_rejection,
          admin_actions_log, internal_notes, admin_assigned_tip,
          confirmed_delivery_address, traveler_address, matched_trip_dates,
          payment_receipt, products_data,
          payment_method, recurrente_checkout_id, recurrente_payment_id
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + PACKAGES_PER_PAGE - 1);

      if (packagesError) {
        console.error('❌ Admin: Packages query error:', packagesError);
        throw packagesError;
      }

      setTotalPackages(count || 0);
      setHasMorePackages(offset + PACKAGES_PER_PAGE < (count || 0));

      console.log('✅ Admin: Fetched packages successfully:', {
        count: packagesData?.length || 0,
        total: count || 0,
        hasMore: offset + PACKAGES_PER_PAGE < (count || 0),
        offset
      });

      // Get unique user IDs from packages (shoppers)
      if (packagesData && packagesData.length > 0) {
        const userIds = [...new Set(packagesData.map(pkg => pkg.user_id))];
        console.log('🔄 Admin: Fetching shopper profiles...', { userIds: userIds.length });
        
        // Fetch shopper profiles in a separate query
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Admin: Error fetching profiles:', profilesError);
        } else {
          // Create a map for quick lookup
          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          // Attach profiles to packages
          const enrichedPackages = packagesData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
          
          console.log('✅ Admin: Enriched packages with shopper profiles');
          return enrichedPackages;
        }
      }

      return (packagesData || []) as LightweightPackage[];
    } catch (error: any) {
      console.error('❌ Admin: Package fetch failed:', error);
      setError(`Error cargando paquetes: ${error.message}`);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes del administrador",
        variant: "destructive",
      });
      return [];
    }
  }, [toast, PACKAGES_PER_PAGE]);

  // Broken statuses that are excluded from initial load
  const BROKEN_STATUSES = ['rejected', 'quote_rejected', 'cancelled', 'quote_expired'];

  // Fetch only ACTIVE matched packages (excluding broken ones)
  const fetchMatchedPackages = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching ACTIVE matched packages (excluding broken)...');
      
      // Load only active packages with a matched_trip_id - excluding broken statuses
      const { data: matchedData, error: matchedError } = await supabase
        .from('packages')
        .select(`
          id,
          user_id,
          status,
          item_description,
          estimated_price,
          purchase_origin,
          package_destination,
          matched_trip_id,
          created_at,
          updated_at,
          delivery_deadline,
          quote_expires_at,
          matched_assignment_expires_at,
          label_number,
          incident_flag,
          delivery_method,
          quote,
          rejection_reason,
          wants_requote,
          admin_rejection,
          quote_rejection,
          traveler_rejection,
          admin_actions_log,
          internal_notes,
          admin_assigned_tip,
          confirmed_delivery_address,
          traveler_address,
          matched_trip_dates,
          payment_receipt,
          payment_method, recurrente_checkout_id,
          products_data, package_destination_country
        `)
        .or('matched_trip_id.not.is.null,status.in.(matched,quote_sent)')
        .not('status', 'in', `(${BROKEN_STATUSES.join(',')})`)
        .order('created_at', { ascending: false });

      if (matchedError) {
        console.error('❌ Admin: Matched packages query error:', matchedError);
        throw matchedError;
      }

      console.log('✅ Admin: Fetched active matched packages:', matchedData?.length || 0);

      // Enrich with profiles if we have packages
      if (matchedData && matchedData.length > 0) {
        const userIds = [...new Set(matchedData.map(pkg => pkg.user_id))];
        console.log('🔄 Admin: Fetching profiles for matched packages...', { userIds: userIds.length });
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Admin: Error fetching profiles for matched packages:', profilesError);
        } else {
          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          const enrichedPackages = matchedData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
          
          console.log('✅ Admin: Enriched matched packages with profiles');
          return enrichedPackages;
        }
      }

      return (matchedData || []) as LightweightPackage[];
    } catch (error: any) {
      console.error('❌ Admin: Matched packages fetch failed:', error);
      return [];
    }
  }, []);

  // Fetch ALL packages pending match (approved or quote_rejected) without pagination
  const fetchPendingMatchPackages = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching ALL pending match packages...');
      
      const { data: pendingData, error: pendingError } = await supabase
        .from('packages')
        .select(`
          id, user_id, status, item_description, estimated_price,
          purchase_origin, package_destination, package_destination_country, matched_trip_id,
          created_at, updated_at, delivery_deadline, quote_expires_at,
          matched_assignment_expires_at, label_number, incident_flag,
          delivery_method, quote, rejection_reason, wants_requote,
          admin_rejection, quote_rejection, traveler_rejection,
          admin_actions_log, internal_notes, admin_assigned_tip,
          confirmed_delivery_address, traveler_address, matched_trip_dates,
          additional_notes, products_data
        `)
        .in('status', ['approved', 'quote_rejected'])
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('❌ Admin: Pending match packages query error:', pendingError);
        throw pendingError;
      }

      console.log('✅ Admin: Fetched pending match packages:', pendingData?.length || 0);

      // Enrich with profiles
      if (pendingData && pendingData.length > 0) {
        const userIds = [...new Set(pendingData.map(pkg => pkg.user_id))];
        console.log('🔄 Admin: Fetching profiles for pending match packages...', { userIds: userIds.length });
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ Admin: Error fetching profiles for pending match packages:', profilesError);
        } else {
          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          const enrichedPackages = pendingData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
          
          console.log('✅ Admin: Enriched pending match packages with profiles');
          return enrichedPackages;
        }
      }

      return (pendingData || []) as LightweightPackage[];
    } catch (error: any) {
      console.error('❌ Admin: Pending match packages fetch failed:', error);
      return [];
    }
  }, []);

  // Fetch ALL packages with pending_approval status (for admin approvals tab)
  const fetchPendingApprovalPackages = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching ALL pending_approval packages...');
      
      const { data: pendingApprovalData, error: pendingApprovalError } = await supabase
        .from('packages')
        .select(`
          id, user_id, status, item_description, estimated_price,
          purchase_origin, package_destination, package_destination_country, matched_trip_id,
          created_at, updated_at, delivery_deadline, quote_expires_at,
          matched_assignment_expires_at, label_number, incident_flag,
          delivery_method, quote, rejection_reason, wants_requote,
          admin_rejection, quote_rejection, traveler_rejection,
          admin_actions_log, internal_notes, admin_assigned_tip,
          confirmed_delivery_address, traveler_address, matched_trip_dates,
          additional_notes, products_data, item_link
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (pendingApprovalError) {
        console.error('❌ Admin: Pending approval packages query error:', pendingApprovalError);
        throw pendingApprovalError;
      }

      console.log('✅ Admin: Fetched pending_approval packages:', pendingApprovalData?.length || 0);

      // Enrich with profiles
      if (pendingApprovalData && pendingApprovalData.length > 0) {
        const userIds = [...new Set(pendingApprovalData.map(pkg => pkg.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const profilesMap = new Map(profilesData.map(p => [p.id, p]));
          
          return pendingApprovalData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
        }
      }

      return (pendingApprovalData || []) as LightweightPackage[];
    } catch (error: any) {
      console.error('❌ Admin: Pending approval packages fetch failed:', error);
      return [];
    }
  }, []);

  const fetchAutoApprovedPayments = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching ALL auto-approved payments (ON-DEMAND)...');
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('packages')
        .select(`
          id, user_id, status, item_description, estimated_price,
          purchase_origin, package_destination, created_at, 
          delivery_method, quote, payment_receipt, updated_at
        `)
        .not('payment_receipt', 'is', null)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('❌ Admin: Error fetching auto-approved payments:', paymentsError);
        throw paymentsError;
      }

      const autoApproved = (paymentsData || []).filter(pkg => {
        const receipt = pkg.payment_receipt as any;
        return receipt?.auto_approved === true || receipt?.auto_approved === 'true';
      });

      console.log('✅ Admin: Found auto-approved payments:', {
        total: paymentsData?.length || 0,
        autoApproved: autoApproved.length
      });

      if (autoApproved.length > 0) {
        const userIds = [...new Set(autoApproved.map(pkg => pkg.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const profilesMap = new Map(profilesData.map(p => [p.id, p]));
          
          return autoApproved.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
        }
      }

      return autoApproved as LightweightPackage[];
    } catch (error: any) {
      console.error('❌ Admin: Auto-approved payments fetch failed:', error);
      return [];
    }
  }, []);

  const fetchApprovedPayments = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching ALL approved payments (ON-DEMAND)...');
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('packages')
        .select(`
          id, user_id, status, item_description, estimated_price,
          purchase_origin, package_destination, created_at, 
          delivery_method, quote, payment_receipt, updated_at
        `)
        .not('payment_receipt', 'is', null)
        .in('status', ['pending_purchase', 'in_transit', 'received_by_traveler', 
                       'pending_office_confirmation', 'delivered_to_office', 'completed'])
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('❌ Admin: Error fetching approved payments:', paymentsError);
        throw paymentsError;
      }

      console.log('✅ Admin: Found approved payments:', paymentsData?.length || 0);

      if (paymentsData && paymentsData.length > 0) {
        const userIds = [...new Set(paymentsData.map(pkg => pkg.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          const profilesMap = new Map(profilesData.map(p => [p.id, p]));
          
          return paymentsData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          })) as LightweightPackage[];
        }
      }

      return (paymentsData || []) as LightweightPackage[];
    } catch (error: any) {
      console.error('❌ Admin: Approved payments fetch failed:', error);
      return [];
    }
  }, []);

  const fetchAdminTrips = useCallback(async () => {
    try {
      console.log('🔄 Admin: Fetching all trips using secure admin RPC...');
      
      const { data, error } = await supabase
        .rpc('get_admin_trips_with_user');

      if (error) {
        console.error('❌ Admin: Error fetching trips:', error);
        throw error;
      }

      let tripsResult: any[] = data || [];
      console.log('✅ Admin: Fetched trips:', tripsResult.length);

      // Create synthetic profiles and public_profiles, and compute traveler_display_name
      tripsResult = tripsResult.map((t) => {
        const nameFromFull = `${t.first_name || ''} ${t.last_name || ''}`.trim();
        const travelerDisplay = t.user_display_name || nameFromFull || t.username || t.email || `Usuario ${String(t.user_id || '').slice(0, 8)}`;
        return {
          ...t,
          user_display_name: t.user_display_name,
          first_name: t.first_name,
          last_name: t.last_name,
          username: t.username,
          email: t.email,
          phone_number: t.phone_number,
          traveler_display_name: travelerDisplay,
          profiles: {
            id: t.user_id,
            display_name: t.user_display_name,
            first_name: t.first_name,
            last_name: t.last_name,
            username: t.username,
            email: t.email,
            avatar_url: null,
            phone_number: t.phone_number
          },
          public_profiles: {
            id: t.user_id,
            first_name: t.first_name,
            last_name: t.last_name,
            username: t.username,
            avatar_url: null
          }
        };
      });

      console.log('🔍 Admin: Sample trip data for debugging:', tripsResult.slice(0, 2).map(t => ({
        id: t.id.slice(0, 8),
        traveler_display_name: t.traveler_display_name,
        user_display_name: t.user_display_name,
        first_name: t.first_name,
        last_name: t.last_name,
        username: t.username,
        email: t.email,
        phone_number: t.phone_number
      })));

      console.log('✅ Admin: Created synthetic profiles for trips');
      return tripsResult;
    } catch (error: any) {
      console.error('❌ Admin: Trip fetch failed:', error);
      setError(`Error cargando viajes: ${error.message}`);
      toast({
        title: "Error",
        description: "No se pudieron cargar los viajes del administrador",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const loadMorePackages = useCallback(async () => {
    if (isLoadingMore || !hasMorePackages) {
      console.log('⏭️ Admin: Skipping load more', { isLoadingMore, hasMorePackages });
      return;
    }

    console.log('🔄 Admin: Loading more packages...', { currentOffset: packagesOffset });
    setIsLoadingMore(true);

    try {
      const newOffset = packagesOffset + PACKAGES_PER_PAGE;
      const morePackages = await fetchAdminPackages(newOffset, true);
      
      if (morePackages.length > 0) {
        setPackages(prev => [...prev, ...morePackages]);
        setPackagesOffset(newOffset);
      }
    } catch (error: any) {
      console.error('❌ Admin: Load more failed:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar más paquetes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePackages, packagesOffset, fetchAdminPackages, toast, PACKAGES_PER_PAGE]);

  const refreshData = useCallback(async (forceRefresh = false) => {
    console.log('📍 refreshData called with:', { 
      forceRefresh, 
      user: !!user, 
      authLoading, 
      isAdmin, 
      wasAdmin,
      userRole: userRole?.role 
    });
    
    const shouldSkip = !user || (authLoading && !wasAdmin);
    
    if (shouldSkip && !forceRefresh) {
      console.log('⏭️ Admin: Skipping refresh', { 
        authLoading, 
        isAdmin, 
        wasAdmin, 
        hasUser: !!user,
        userRole: userRole?.role,
        reason: !user ? 'no_user' : 'loading_and_not_was_admin'
      });
      return;
    }

    console.log('🔄 Admin: Starting data refresh...', { isAdmin, wasAdmin, authLoading, forceRefresh });
    setLoading(true);
    setError(null);
    setPackagesOffset(0);
    setHasMorePackages(true);

    try {
      const [paginatedPackages, matchedPkgs, pendingMatchPkgs, pendingApprovalPkgs, tripsData] = await Promise.all([
        fetchAdminPackages(0, false),
        fetchMatchedPackages(),
        fetchPendingMatchPackages(),
        fetchPendingApprovalPackages(),
        fetchAdminTrips()
      ]);

      // Merge packages: use Map to avoid duplicates, preserving profiles data
      const allPackagesMap = new Map<string, any>();
      [...paginatedPackages, ...matchedPkgs, ...pendingMatchPkgs, ...pendingApprovalPkgs].forEach(pkg => {
        const existing = allPackagesMap.get(pkg.id);
        if (existing) {
          // Preserve profiles if existing has it and new one doesn't
          allPackagesMap.set(pkg.id, {
            ...pkg,
            profiles: pkg.profiles || existing.profiles
          });
        } else {
          allPackagesMap.set(pkg.id, pkg);
        }
      });
      
      const mergedPackages = Array.from(allPackagesMap.values());

      setPackages(mergedPackages);
      setTrips(tripsData);
      
      console.log('✅ Admin: Data refresh complete', {
        paginated: paginatedPackages.length,
        matched: matchedPkgs.length,
        pendingMatch: pendingMatchPkgs.length,
        pendingApproval: pendingApprovalPkgs.length,
        merged: mergedPackages.length,
        trips: tripsData.length,
        totalPackages
      });
    } catch (error: any) {
      console.error('❌ Admin: Data refresh failed:', error);
      setError(error.message);
      
      if (!authLoading && (isAdmin || wasAdmin)) {
        console.log('🔄 Admin: Scheduling retry in 2 seconds...');
        setTimeout(() => {
          refreshData();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, wasAdmin, authLoading, user, fetchAdminPackages, fetchMatchedPackages, fetchPendingMatchPackages, fetchPendingApprovalPackages, fetchAdminTrips, totalPackages]);

  // On-demand loading functions
  const loadAutoApprovedPayments = useCallback(async () => {
    if (autoApprovedPayments.length > 0) {
      console.log('⏭️ Admin: Auto-approved payments already loaded');
      return;
    }
    setAutoApprovedPaymentsLoading(true);
    const data = await fetchAutoApprovedPayments();
    setAutoApprovedPayments(data);
    setAutoApprovedPaymentsLoading(false);
  }, [autoApprovedPayments.length, fetchAutoApprovedPayments]);

  const loadApprovedPayments = useCallback(async () => {
    if (approvedPaymentsData.length > 0) {
      console.log('⏭️ Admin: Approved payments already loaded');
      return;
    }
    setApprovedPaymentsLoading(true);
    const data = await fetchApprovedPayments();
    setApprovedPaymentsData(data);
    setApprovedPaymentsLoading(false);
  }, [approvedPaymentsData.length, fetchApprovedPayments]);

  useEffect(() => {
    console.log('🔍 Admin: Effect triggered', {
      isAdmin,
      wasAdmin,
      authLoading,
      user: !!user,
      userId: user?.id,
      userRole: userRole?.role,
      shouldLoad: (isAdmin || wasAdmin) && user
    });

    // FORCE LOAD si el user existe y alguna vez fue admin o es admin actual
    if ((isAdmin || wasAdmin) && user) {
      console.log('🚀 Admin: Starting initial data load...');
      refreshData();
    } else if (!authLoading && !isAdmin && !wasAdmin && userRole) {
      console.log('⚠️ Admin: User is definitively not admin, clearing data');
      setPackages([]);
      setTrips([]);
      setLoading(false);
    } else if (!authLoading && user && !userRole) {
      console.log('⚠️ Admin: User has no role assigned yet');
    }
  }, [isAdmin, wasAdmin, authLoading, user, userRole, refreshData]);

  useEffect(() => {
    const shouldRetry = !loading && 
                       !authLoading && 
                       (isAdmin || wasAdmin) && 
                       user &&
                       packages.length === 0 && 
                       trips.length === 0 && 
                       !error;

    if (shouldRetry) {
      console.log('🔄 Admin: Data appears empty, retrying with enhanced conditions...');
      const retryTimer = setTimeout(() => {
        refreshData();
      }, 1500);
      
      return () => clearTimeout(retryTimer);
    }
  }, [loading, authLoading, isAdmin, wasAdmin, user, packages.length, trips.length, error, refreshData]);

  const optimisticUpdatePackage = useCallback((packageId: string, updates: any) => {
    console.log('🚀 Admin: Optimistic package update:', packageId, updates);
    setPackages(prevPackages => 
      prevPackages.map(pkg => 
        pkg.id === packageId ? { ...pkg, ...updates } : pkg
      )
    );
  }, []);

  const optimisticUpdateTrip = useCallback((tripId: string, updates: any) => {
    console.log('🚀 Admin: Optimistic trip update:', tripId, updates);
    setTrips(prevTrips => 
      prevTrips.map(trip => 
        trip.id === tripId ? { ...trip, ...updates } : trip
      )
    );
  }, []);

  const memoizedResult = useMemo(() => ({
    packages,
    trips,
    loading,
    error,
    refreshData,
    loadMorePackages,
    hasMorePackages,
    totalPackages,
    optimisticUpdatePackage,
    optimisticUpdateTrip,
    unreadCounts,
    markPackageMessagesAsRead,
    autoApprovedPayments,
    approvedPaymentsData,
    autoApprovedPaymentsLoading,
    approvedPaymentsLoading,
    loadAutoApprovedPayments,
    loadApprovedPayments
  }), [packages, trips, loading, error, refreshData, loadMorePackages, hasMorePackages, totalPackages, optimisticUpdatePackage, optimisticUpdateTrip, unreadCounts, markPackageMessagesAsRead, autoApprovedPayments, approvedPaymentsData, autoApprovedPaymentsLoading, approvedPaymentsLoading, loadAutoApprovedPayments, loadApprovedPayments]);

  console.log('📊 Admin: Returning data', {
    packagesCount: packages.length,
    tripsCount: trips.length,
    loading,
    error: !!error,
    isAdmin
  });

  return memoizedResult;
};

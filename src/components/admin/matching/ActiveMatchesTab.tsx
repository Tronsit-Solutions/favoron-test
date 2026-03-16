import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Search, Filter, ChevronDown, Archive, Loader2 } from "lucide-react";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { MatchCard } from "./MatchCard";
import { MatchStatsHeader } from "./MatchStatsHeader";
import { MatchChatModal } from "./MatchChatModal";
import { getStatusInfo } from "./MatchStatusBadge";
import { supabase } from "@/integrations/supabase/client";

const MATCHES_PER_PAGE = 30;
const BROKEN_STATUSES = ['rejected', 'quote_rejected', 'cancelled', 'quote_expired'];

interface ActiveMatchesTabProps {
  packages: any[];
  trips: any[];
  modalDataCache?: { selectedPackage: any; matchedTrip: any } | null;
  onViewPackageDetail: (pkg: any) => void;
  onConfirmOfficeReception: (packageId: string) => void;
  onConfirmDeliveryComplete: (packageId: string) => void;
  onAdminConfirmOfficeDelivery: (packageId: string) => void;
  onConfirmShopperReceived: (packageId: string) => void;
  onOpenActionsModal?: (packageId: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
  unreadCounts?: { [packageId: string]: number };
  markPackageMessagesAsRead?: (packageId: string) => Promise<void>;
  hasMessages?: (packageId: string) => boolean;
  assignmentsMap?: { [packageId: string]: { count: number; assignments: any[] } };
  multiAssignedPackageIds?: Set<string>;
}

const ActiveMatchesTab = ({ 
  packages, 
  trips, 
  modalDataCache,
  onViewPackageDetail,
  onConfirmOfficeReception,
  onConfirmDeliveryComplete,
  onAdminConfirmOfficeDelivery,
  onConfirmShopperReceived,
  onOpenActionsModal,
  getStatusBadge,
  unreadCounts = {},
  markPackageMessagesAsRead,
  hasMessages = () => false,
  assignmentsMap = {},
  multiAssignedPackageIds
}: ActiveMatchesTabProps) => {
  const [selectedChatPackage, setSelectedChatPackage] = useState<any>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState(MATCHES_PER_PAGE);
  const [brokenMatches, setBrokenMatches] = useState<any[]>([]);
  const [loadingBroken, setLoadingBroken] = useState(false);
  const [showBrokenMatches, setShowBrokenMatches] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    searchTerm,
    setSearchTerm,
    matchedPackages,
    brokenMatchesCount,
    statuses,
    statsData
  } = useMatchFilters(packages, trips, multiAssignedPackageIds);

  // Debounce search with useRef to avoid lodash dependency issues
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  }, [setSearchTerm]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Load broken matches on demand
  const loadBrokenMatches = useCallback(async () => {
    setLoadingBroken(true);
    try {
      console.log('🔄 Loading broken matches on demand...');
      
      const { data: brokenData, error } = await supabase
        .from('packages')
        .select(`
          id, user_id, status, item_description, estimated_price,
          purchase_origin, package_destination, matched_trip_id,
          created_at, updated_at, delivery_deadline, quote_expires_at,
          matched_assignment_expires_at, label_number, incident_flag,
          delivery_method, quote, rejection_reason, wants_requote,
          admin_rejection, quote_rejection, traveler_rejection,
          admin_actions_log, internal_notes, admin_assigned_tip,
          confirmed_delivery_address, traveler_address, matched_trip_dates,
          payment_receipt
        `)
        .not('matched_trip_id', 'is', null)
        .in('status', BROKEN_STATUSES)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with profiles
      if (brokenData && brokenData.length > 0) {
        const userIds = [...new Set(brokenData.map(pkg => pkg.user_id))];
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email, phone_number, country_code, trust_level, prime_expires_at')
          .in('id', userIds);

        if (profilesData) {
          const profilesMap = new Map(profilesData.map(p => [p.id, p]));
          
          const enriched = brokenData.map(pkg => ({
            ...pkg,
            profiles: profilesMap.get(pkg.user_id) || null
          }));
          
          setBrokenMatches(enriched);
          setShowBrokenMatches(true);
          console.log('✅ Loaded broken matches:', enriched.length);
        }
      } else {
        setBrokenMatches([]);
        setShowBrokenMatches(true);
      }
    } catch (error) {
      console.error('❌ Error loading broken matches:', error);
    } finally {
      setLoadingBroken(false);
    }
  }, []);

  // Estado para los checkboxes de filtros
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());

  // Combine active and broken matches when broken are loaded
  const allMatchedPackages = useMemo(() => {
    if (showBrokenMatches) {
      return [...matchedPackages, ...brokenMatches];
    }
    return matchedPackages;
  }, [matchedPackages, brokenMatches, showBrokenMatches]);

  // Get all statuses including broken ones when loaded
  const allStatuses = useMemo(() => {
    const statusSet = new Set(allMatchedPackages.map(pkg => pkg.status));
    return [...statusSet];
  }, [allMatchedPackages]);

  // Sincronizar estados seleccionados al cargar
  useEffect(() => {
    setSelectedStatuses(prev => {
      if (prev.size === 0 && allStatuses.length > 0) {
        return new Set(allStatuses);
      }
      const next = new Set([...prev].filter(s => allStatuses.includes(s)));
      allStatuses.forEach(s => {
        if (!next.has(s)) next.add(s);
      });
      return next;
    });
  }, [allStatuses]);

  // Memoized filtered and sorted matches
  const filteredMatches = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    
    // Helper function to check if package has active timers
    const hasActiveTimer = (pkg: any) => {
      const now = Date.now();
      const assignmentExpiry = pkg.matched_assignment_expires_at ? new Date(pkg.matched_assignment_expires_at).getTime() : null;
      const quoteExpiry = pkg.quote_expires_at ? new Date(pkg.quote_expires_at).getTime() : null;
      return (assignmentExpiry && assignmentExpiry > now) || (quoteExpiry && quoteExpiry > now);
    };

    // Priority categories (defined once)
    const adminActionStatuses = ['pending_office_confirmation', 'delivered_to_office'];
    const timerStatuses = ['matched', 'quote_sent', 'payment_pending'];
    const receivedByTravelerStatuses = ['received_by_traveler'];
    const completedStatuses = ['completed'];

    return allMatchedPackages
      .filter(pkg => {
        const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
        
        // Combinar nombres para búsqueda con espacios
        const shopperFullName = `${(pkg as any)?.profiles?.first_name || ''} ${(pkg as any)?.profiles?.last_name || ''}`.toLowerCase();
        const travelerFullName = `${(matchedTrip as any)?.profiles?.first_name || ''} ${(matchedTrip as any)?.profiles?.last_name || ''}`.toLowerCase();
        
        const matchesSearch = !search ||
          (pkg.item_description || '').toLowerCase().includes(search) ||
          (pkg.user_id || '').toString().includes(search) ||
          (pkg.label_number || '').toString().includes(search) ||
          (matchedTrip?.from_city || '').toLowerCase().includes(search) ||
          (matchedTrip?.to_city || '').toLowerCase().includes(search) ||
          shopperFullName.includes(search) ||
          ((pkg as any)?.profiles?.username || '').toLowerCase().includes(search) ||
          travelerFullName.includes(search) ||
          ((matchedTrip as any)?.profiles?.username || '').toLowerCase().includes(search);
        
        const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(pkg.status);
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Broken matches always go to the bottom
        const aIsBroken = BROKEN_STATUSES.includes(a.status);
        const bIsBroken = BROKEN_STATUSES.includes(b.status);
        
        if (aIsBroken && !bIsBroken) return 1;
        if (!aIsBroken && bIsBroken) return -1;
        
        const aAdminAction = adminActionStatuses.includes(a.status);
        const bAdminAction = adminActionStatuses.includes(b.status);
        
        if (aAdminAction && !bAdminAction) return -1;
        if (!aAdminAction && bAdminAction) return 1;
        
        const aHasTimer = timerStatuses.includes(a.status) && hasActiveTimer(a);
        const bHasTimer = timerStatuses.includes(b.status) && hasActiveTimer(b);
        
        if (!aAdminAction && !bAdminAction) {
          if (aHasTimer && !bHasTimer) return -1;
          if (!aHasTimer && bHasTimer) return 1;
          
          if (!aHasTimer && !bHasTimer) {
            const aReceivedByTraveler = receivedByTravelerStatuses.includes(a.status);
            const bReceivedByTraveler = receivedByTravelerStatuses.includes(b.status);
            const aCompleted = completedStatuses.includes(a.status);
            const bCompleted = completedStatuses.includes(b.status);
            
            const aOtherStatus = !aReceivedByTraveler && !aCompleted;
            const bOtherStatus = !bReceivedByTraveler && !bCompleted;
            
            if (aOtherStatus && !bOtherStatus) return -1;
            if (!aOtherStatus && bOtherStatus) return 1;
            
            if (!aOtherStatus && !bOtherStatus) {
              if (aReceivedByTraveler && !bReceivedByTraveler) return -1;
              if (!aReceivedByTraveler && bReceivedByTraveler) return 1;
              
              if (aCompleted && !bCompleted) return 1;
              if (!aCompleted && bCompleted) return -1;
            }
          }
        }
        
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [allMatchedPackages, trips, searchTerm, selectedStatuses]);

  // Visible matches with lazy loading
  const visibleMatches = useMemo(() => 
    filteredMatches.slice(0, visibleCount), 
    [filteredMatches, visibleCount]
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredMatches.length) {
          setVisibleCount(prev => Math.min(prev + MATCHES_PER_PAGE, filteredMatches.length));
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [visibleCount, filteredMatches.length]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(MATCHES_PER_PAGE);
  }, [searchTerm, selectedStatuses]);

  const togglePackage = (packageId: string) => {
    setExpandedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageId)) {
        newSet.delete(packageId);
      } else {
        newSet.add(packageId);
      }
      return newSet;
    });
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const toggleAllStatuses = () => {
    if (selectedStatuses.size === allStatuses.length) {
      // Si todos están seleccionados, deseleccionar todos
      setSelectedStatuses(new Set());
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setSelectedStatuses(new Set(allStatuses));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <MatchStatsHeader 
        totalMatches={filteredMatches.length}
        statsData={statsData}
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, nombres, usuario o ruta..."
            value={inputValue}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        {/* Status Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Estados ({selectedStatuses.size}/{allStatuses.length})</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-background border shadow-lg z-50" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Filtrar por estados</span>
              <span className="text-xs text-muted-foreground">
                {selectedStatuses.size}/{allStatuses.length} sel.
              </span>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuCheckboxItem
              checked={selectedStatuses.size === allStatuses.length}
              onCheckedChange={toggleAllStatuses}
              className="font-medium"
            >
              {selectedStatuses.size === allStatuses.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            
            {allStatuses.map(status => {
              const info = getStatusInfo(status);
              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={selectedStatuses.has(status)}
                  onCheckedChange={() => toggleStatus(status)}
                  className="flex items-center gap-2"
                >
                  <span className="flex items-center gap-2">
                    {info.icon} {info.label}
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">🔗</div>
                <p className="text-muted-foreground">
                  {searchTerm || selectedStatuses.size === 0
                    ? "No se encontraron matches con los filtros aplicados"
                    : "No hay matches activos"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {visibleMatches.map(pkg => {
              const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
              
              return (
                <MatchCard
                  key={pkg.id}
                  pkg={pkg}
                  matchedTrip={matchedTrip}
                  isExpanded={expandedPackages.has(pkg.id)}
                  assignmentInfo={assignmentsMap[pkg.id]}
                  onToggle={() => togglePackage(pkg.id)}
                  onViewDetail={() => onViewPackageDetail(pkg)}
                  onOpenChat={() => {
                    // Cache modal data when opening chat
                    const matchedTrip = trips.find(t => t.id === pkg.matched_trip_id);
                    console.log('💾 Caching chat modal data:', { package: pkg.id, trip: matchedTrip?.id });
                    setSelectedChatPackage(pkg);
                  }}
                  onConfirmOfficeReception={() => onConfirmOfficeReception(pkg.id)}
                  onConfirmDeliveryComplete={() => onConfirmDeliveryComplete(pkg.id)}
                  onAdminConfirmOfficeDelivery={() => onAdminConfirmOfficeDelivery(pkg.id)}
                  onConfirmShopperReceived={() => onConfirmShopperReceived(pkg.id)}
                  onOpenActionsModal={onOpenActionsModal}
                  unreadCount={unreadCounts[pkg.id] || 0}
                  hasMessages={hasMessages(pkg.id)}
                />
              );
            })}
            
            {/* Load more trigger for infinite scroll */}
            {visibleCount < filteredMatches.length && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Cargando más matches...</span>
                </div>
              </div>
            )}
            
            {/* Show count */}
            {visibleCount >= filteredMatches.length && filteredMatches.length > MATCHES_PER_PAGE && (
              <div className="text-center text-sm text-muted-foreground py-2">
                Mostrando todos los {filteredMatches.length} matches
              </div>
            )}
          </>
        )}
        
        {/* Button to load broken matches */}
        {!showBrokenMatches && brokenMatchesCount > 0 && (
          <Button 
            variant="outline" 
            onClick={loadBrokenMatches}
            disabled={loadingBroken}
            className="w-full mt-4"
          >
            {loadingBroken ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cargando matches rotos...
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Cargar {brokenMatchesCount} matches rotos (rechazados, cancelados, expirados)
              </>
            )}
          </Button>
        )}
        
        {showBrokenMatches && brokenMatches.length > 0 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            ✓ {brokenMatches.length} matches rotos cargados
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <MatchChatModal
        selectedPackage={selectedChatPackage}
        trips={trips}
        modalDataCache={modalDataCache}
        onClose={() => setSelectedChatPackage(null)}
        onMarkAsRead={markPackageMessagesAsRead}
      />
    </div>
  );
};

export default ActiveMatchesTab;


import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Search, Filter, ChevronDown } from "lucide-react";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { MatchCard } from "./MatchCard";
import { MatchStatsHeader } from "./MatchStatsHeader";
import { MatchChatModal } from "./MatchChatModal";
import { getStatusInfo } from "./MatchStatusBadge";

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
  onOpenActionsModal
}: ActiveMatchesTabProps) => {
  const [selectedChatPackage, setSelectedChatPackage] = useState<any>(null);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  const {
    searchTerm,
    setSearchTerm,
    matchedPackages,
    statuses,
    statsData
  } = useMatchFilters(packages, trips);

  // Estado para los checkboxes de filtros
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(statuses));

  // Filtrar matches basado en búsqueda y estados seleccionados
  const filteredMatches = matchedPackages.filter(pkg => {
    const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
    
    const matchesSearch = 
      (pkg.item_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.user_id || '').toString().includes(searchTerm) ||
      (matchedTrip?.from_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (matchedTrip?.to_city || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatuses.has(pkg.status);
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Helper function to check if package has active timers
    const hasActiveTimer = (pkg: any) => {
      const now = new Date();
      const assignmentExpiry = pkg.matched_assignment_expires_at ? new Date(pkg.matched_assignment_expires_at) : null;
      const quoteExpiry = pkg.quote_expires_at ? new Date(pkg.quote_expires_at) : null;
      
      return (assignmentExpiry && assignmentExpiry > now) || (quoteExpiry && quoteExpiry > now);
    };

    // Define priority categories
    const adminActionStatuses = ['pending_office_confirmation', 'delivered_to_office'];
    const timerStatuses = ['matched', 'quote_sent', 'payment_pending'];
    const receivedByTravelerStatuses = ['received_by_traveler'];
    const completedStatuses = ['completed'];
    
    // Check category for each package
    const aAdminAction = adminActionStatuses.includes(a.status);
    const bAdminAction = adminActionStatuses.includes(b.status);
    
    const aHasTimer = timerStatuses.includes(a.status) && hasActiveTimer(a);
    const bHasTimer = timerStatuses.includes(b.status) && hasActiveTimer(b);
    
    const aReceivedByTraveler = receivedByTravelerStatuses.includes(a.status);
    const bReceivedByTraveler = receivedByTravelerStatuses.includes(b.status);
    
    const aCompleted = completedStatuses.includes(a.status);
    const bCompleted = completedStatuses.includes(b.status);
    
    // Priority 1: Admin actions pending
    if (aAdminAction && !bAdminAction) return -1;
    if (!aAdminAction && bAdminAction) return 1;
    
    // Priority 2: Packages with active timers
    if (!aAdminAction && !bAdminAction) {
      if (aHasTimer && !bHasTimer) return -1;
      if (!aHasTimer && bHasTimer) return 1;
      
      // Priority 3: Regular packages (not received or completed)
      if (!aHasTimer && !bHasTimer) {
        const aOtherStatus = !aReceivedByTraveler && !aCompleted;
        const bOtherStatus = !bReceivedByTraveler && !bCompleted;
        
        if (aOtherStatus && !bOtherStatus) return -1;
        if (!aOtherStatus && bOtherStatus) return 1;
        
        // Priority 4: Received by traveler (penultimate)
        if (!aOtherStatus && !bOtherStatus) {
          if (aReceivedByTraveler && !bReceivedByTraveler) return -1;
          if (!aReceivedByTraveler && bReceivedByTraveler) return 1;
          
          // Priority 5: Completed (last)
          if (aCompleted && !bCompleted) return 1;
          if (!aCompleted && bCompleted) return -1;
        }
      }
    }
    
    // Secondary sort: Creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

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
    if (selectedStatuses.size === statuses.length) {
      // Si todos están seleccionados, deseleccionar todos
      setSelectedStatuses(new Set());
    } else {
      // Si no todos están seleccionados, seleccionar todos
      setSelectedStatuses(new Set(statuses));
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
            placeholder="Buscar por descripción, usuario o ruta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Estados ({selectedStatuses.size}/{statuses.length})</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-background border shadow-lg z-50" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Filtrar por estados</span>
              <span className="text-xs text-muted-foreground">
                {selectedStatuses.size}/{statuses.length} sel.
              </span>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuCheckboxItem
              checked={selectedStatuses.size === statuses.length}
              onCheckedChange={toggleAllStatuses}
              className="font-medium"
            >
              {selectedStatuses.size === statuses.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            
            {statuses.map(status => {
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
          filteredMatches.map(pkg => {
            const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
            
            return (
              <MatchCard
                key={pkg.id}
                pkg={pkg}
                matchedTrip={matchedTrip}
                isExpanded={expandedPackages.has(pkg.id)}
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
              />
            );
          })
        )}
      </div>

      {/* Chat Modal */}
      <MatchChatModal
        selectedPackage={selectedChatPackage}
        trips={trips}
        modalDataCache={modalDataCache}
        onClose={() => setSelectedChatPackage(null)}
      />
    </div>
  );
};

export default ActiveMatchesTab;

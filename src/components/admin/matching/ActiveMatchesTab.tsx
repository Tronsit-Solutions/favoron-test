
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter } from "lucide-react";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { MatchCard } from "./MatchCard";
import { MatchStatsHeader } from "./MatchStatsHeader";
import { MatchChatModal } from "./MatchChatModal";
import { getStatusInfo } from "./MatchStatusBadge";

interface ActiveMatchesTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onConfirmOfficeReception: (packageId: string) => void;
  onConfirmDeliveryComplete: (packageId: string) => void;
  onAdminConfirmOfficeDelivery: (packageId: string) => void;
  onConfirmShopperReceived: (packageId: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const ActiveMatchesTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail,
  onConfirmOfficeReception,
  onConfirmDeliveryComplete,
  onAdminConfirmOfficeDelivery,
  onConfirmShopperReceived
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
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, usuario o ruta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Filtrar por estados:</Label>
            </div>
            
            <div className="space-y-3">
              {/* Select All/None Toggle */}
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="toggle-all"
                  checked={selectedStatuses.size === statuses.length}
                  onCheckedChange={toggleAllStatuses}
                />
                <Label htmlFor="toggle-all" className="text-sm font-medium">
                  {selectedStatuses.size === statuses.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </Label>
                <span className="text-xs text-muted-foreground">
                  ({selectedStatuses.size}/{statuses.length} seleccionados)
                </span>
              </div>

              {/* Individual Status Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {statuses.map(status => {
                  const info = getStatusInfo(status);
                  return (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={selectedStatuses.has(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <Label 
                        htmlFor={`status-${status}`} 
                        className="text-sm flex items-center gap-1 cursor-pointer"
                      >
                        {info.icon} {info.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
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
                onOpenChat={() => setSelectedChatPackage(pkg)}
                onConfirmOfficeReception={() => onConfirmOfficeReception(pkg.id)}
                onConfirmDeliveryComplete={() => onConfirmDeliveryComplete(pkg.id)}
                onAdminConfirmOfficeDelivery={() => onAdminConfirmOfficeDelivery(pkg.id)}
                onConfirmShopperReceived={() => onConfirmShopperReceived(pkg.id)}
              />
            );
          })
        )}
      </div>

      {/* Chat Modal */}
      <MatchChatModal
        selectedPackage={selectedChatPackage}
        trips={trips}
        onClose={() => setSelectedChatPackage(null)}
      />
    </div>
  );
};

export default ActiveMatchesTab;

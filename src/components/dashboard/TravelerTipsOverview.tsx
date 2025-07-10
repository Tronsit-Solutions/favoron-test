import { DollarSign, TrendingUp, Package, ChevronDown, ChevronUp, Filter, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface TravelerTipsOverviewProps {
  packages: any[];
  trips: any[];
}

const TravelerTipsOverview = ({ packages, trips }: TravelerTipsOverviewProps) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>("all");

  // Filter packages based on selected trip, excluding rejected ones for active counts
  const allFilteredPackages = selectedTripFilter === "all" 
    ? packages 
    : packages.filter(pkg => pkg.matchedTripId === parseInt(selectedTripFilter));

  // Active packages (excluding rejected)
  const filteredPackages = allFilteredPackages.filter(pkg => pkg.status !== 'rejected');
  
  // Rejected packages (to show separately)
  const rejectedPackages = allFilteredPackages.filter(pkg => pkg.status === 'rejected');

  // Calculate total tips from active packages only
  const totalTips = filteredPackages.reduce((sum, pkg) => {
    if (pkg.quote?.price) {
      return sum + parseFloat(pkg.quote.price);
    }
    return sum;
  }, 0);

  // Count packages with confirmed tips (active only)
  const packagesWithTips = filteredPackages.filter(pkg => pkg.quote?.price).length;
  
  // Count pending quotes (packages that could generate tips)
  const pendingQuotes = filteredPackages.filter(pkg => pkg.status === 'matched').length;

  // Group packages by trip for breakdown (excluding rejected)
  const packagesByTrip = trips.reduce((acc, trip) => {
    const tripPackages = packages.filter(pkg => pkg.matchedTripId === trip.id && pkg.status !== 'rejected');
    if (tripPackages.length > 0) {
      acc[trip.id] = {
        trip,
        packages: tripPackages,
        totalTips: tripPackages.reduce((sum, pkg) => 
          sum + (pkg.quote?.price ? parseFloat(pkg.quote.price) : 0), 0
        )
      };
    }
    return acc;
  }, {} as Record<number, any>);

  // Show if there are tips, pending opportunities, or rejected packages
  if (totalTips === 0 && pendingQuotes === 0 && rejectedPackages.length === 0) return null;

  const selectedTripName = selectedTripFilter === "all" 
    ? "Todos los viajes" 
    : trips.find(t => t.id === parseInt(selectedTripFilter))?.fromCity + " → " + trips.find(t => t.id === parseInt(selectedTripFilter))?.toCity;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            💰 Compensaciones
          </CardTitle>
          
          {/* Trip Filter */}
          {Object.keys(packagesByTrip).length > 1 && (
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <Select value={selectedTripFilter} onValueChange={setSelectedTripFilter}>
                <SelectTrigger className="w-[160px] h-7 text-xs">
                  <SelectValue placeholder="Filtrar viaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los viajes</SelectItem>
                  {Object.values(packagesByTrip).map((tripData: any) => (
                    <SelectItem key={tripData.trip.id} value={tripData.trip.id.toString()}>
                      {tripData.trip.fromCity} → {tripData.trip.toCity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {selectedTripFilter !== "all" && (
          <p className="text-xs text-muted-foreground">
            {selectedTripName}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-3">
          {/* Total Tips */}
          <div className="text-center p-3 bg-muted/30 rounded border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3" />
              <p className="text-xs font-medium">Total Ganado</p>
            </div>
            <p className="text-lg font-bold">${totalTips.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {packagesWithTips} confirmado{packagesWithTips !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Packages Count */}
          <div className="text-center p-3 bg-muted/30 rounded border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="h-3 w-3" />
              <p className="text-xs font-medium">Activos</p>
            </div>
            <p className="text-lg font-bold">{filteredPackages.length}</p>
            <p className="text-xs text-muted-foreground">
              {selectedTripFilter === "all" ? "todos los viajes" : "este viaje"}
            </p>
          </div>

          {/* Opportunities */}
          <div className="text-center p-3 bg-muted/30 rounded border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3 w-3" />
              <p className="text-xs font-medium">Oportunidades</p>
            </div>
            <p className="text-lg font-bold">{pendingQuotes}</p>
            <p className="text-xs text-muted-foreground">
              esperando cotización
            </p>
          </div>
        </div>

        {/* Rejected Packages Section */}
        {rejectedPackages.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  Paquetes Rechazados ({rejectedPackages.length})
                </p>
              </div>
              <div className="space-y-2">
                {rejectedPackages.map((pkg, index) => (
                  <div key={pkg.id} className="bg-white rounded border border-red-100 p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {pkg.products?.[0]?.itemDescription || pkg.itemDescription}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          💰 Cotización rechazada: ${pkg.quote?.totalPrice || 'N/A'}
                        </p>
                        {pkg.rejectionReason && (
                          <p className="text-xs text-red-700 mt-1">
                            📝 Razón: {pkg.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-red-600">
                          Rechazado
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-3 italic">
                💡 Los paquetes rechazados no afectan tus estadísticas de compensaciones ni paquetes activos.
              </p>
            </div>
          </div>
        )}

        {/* Multi-trip breakdown - show only when viewing all trips */}
        {selectedTripFilter === "all" && Object.keys(packagesByTrip).length > 1 && (
          <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
            <div className="mt-4 pt-4 border-t">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full text-left hover:bg-muted/50 rounded p-2 transition-colors">
                  <p className="text-xs text-muted-foreground">Desglose por viaje:</p>
                  {isBreakdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-2 text-sm mt-2">
                  {Object.values(packagesByTrip).map((tripData: any) => (
                    <div key={tripData.trip.id} className="flex justify-between items-center py-2 border-b border-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{tripData.trip.fromCity} → {tripData.trip.toCity}</p>
                        <p className="text-xs text-muted-foreground">
                          {tripData.packages.length} paquete{tripData.packages.length !== 1 ? 's' : ''} • 
                          {tripData.packages.filter((pkg: any) => pkg.quote?.price).length} con cotización
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${tripData.totalTips.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">ganancia</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Single trip package breakdown */}
        {selectedTripFilter !== "all" && packagesWithTips > 1 && (
          <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
            <div className="mt-4 pt-4 border-t">
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full text-left hover:bg-muted/50 rounded p-2 transition-colors">
                  <p className="text-xs text-muted-foreground">Desglose por paquete:</p>
                  {isBreakdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-1 text-xs mt-2">
                  {filteredPackages
                    .filter(pkg => pkg.quote?.price)
                    .map((pkg, index) => (
                      <div key={pkg.id} className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          Paquete #{index + 1}: {pkg.products?.[0]?.itemDescription || pkg.itemDescription}
                        </span>
                        <span className="font-medium">
                          +${parseFloat(pkg.quote.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

export default TravelerTipsOverview;
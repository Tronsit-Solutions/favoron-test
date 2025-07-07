import { DollarSign, TrendingUp, Package, ChevronDown, ChevronUp, Filter } from "lucide-react";
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

  // Filter packages based on selected trip
  const filteredPackages = selectedTripFilter === "all" 
    ? packages 
    : packages.filter(pkg => pkg.matchedTripId === parseInt(selectedTripFilter));

  // Calculate total tips from filtered packages
  const totalTips = filteredPackages.reduce((sum, pkg) => {
    if (pkg.quote?.price) {
      return sum + parseFloat(pkg.quote.price);
    }
    return sum;
  }, 0);

  // Count packages with confirmed tips
  const packagesWithTips = filteredPackages.filter(pkg => pkg.quote?.price).length;
  
  // Count pending quotes (packages that could generate tips)
  const pendingQuotes = filteredPackages.filter(pkg => pkg.status === 'matched').length;

  // Group packages by trip for breakdown
  const packagesByTrip = trips.reduce((acc, trip) => {
    const tripPackages = packages.filter(pkg => pkg.matchedTripId === trip.id);
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

  // Only show if there are tips or pending opportunities
  if (totalTips === 0 && pendingQuotes === 0) return null;

  const selectedTripName = selectedTripFilter === "all" 
    ? "Todos los viajes" 
    : trips.find(t => t.id === parseInt(selectedTripFilter))?.fromCity + " → " + trips.find(t => t.id === parseInt(selectedTripFilter))?.toCity;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            💰 Resumen de Compensaciones
          </CardTitle>
          
          {/* Trip Filter */}
          {Object.keys(packagesByTrip).length > 1 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTripFilter} onValueChange={setSelectedTripFilter}>
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue placeholder="Filtrar por viaje" />
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
          <p className="text-sm text-muted-foreground">
            Mostrando datos de: {selectedTripName}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Tips */}
          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              <p className="text-sm font-medium">Total Ganado</p>
            </div>
            <p className="text-2xl font-bold">${totalTips.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {packagesWithTips} paquete{packagesWithTips !== 1 ? 's' : ''} confirmado{packagesWithTips !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Packages Count */}
          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="h-4 w-4" />
              <p className="text-sm font-medium">Paquetes Activos</p>
            </div>
            <p className="text-2xl font-bold">{filteredPackages.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedTripFilter === "all" ? "Total de todos los viajes" : "En este viaje"}
            </p>
          </div>

          {/* Opportunities */}
          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              <p className="text-sm font-medium">Oportunidades</p>
            </div>
            <p className="text-2xl font-bold">{pendingQuotes}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Paquete{pendingQuotes !== 1 ? 's' : ''} esperando cotización
            </p>
          </div>
        </div>

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
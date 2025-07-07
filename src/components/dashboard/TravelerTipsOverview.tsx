import { DollarSign, TrendingUp, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface TravelerTipsOverviewProps {
  packages: any[];
}

const TravelerTipsOverview = ({ packages }: TravelerTipsOverviewProps) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  
  // Calculate total tips from all packages with quotes
  const totalTips = packages.reduce((sum, pkg) => {
    if (pkg.quote?.price) {
      return sum + parseFloat(pkg.quote.price);
    }
    return sum;
  }, 0);

  // Count packages with confirmed tips
  const packagesWithTips = packages.filter(pkg => pkg.quote?.price).length;
  
  // Count pending quotes (packages that could generate tips)
  const pendingQuotes = packages.filter(pkg => pkg.status === 'matched').length;

  // Only show if there are tips or pending opportunities
  if (totalTips === 0 && pendingQuotes === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          💰 Resumen de Compensaciones - Tu Viaje
        </CardTitle>
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
            <p className="text-2xl font-bold">{packages.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Total asignados a tus viajes
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

        {/* Quick tip breakdown if there are multiple packages with tips */}
        {packagesWithTips > 1 && (
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
                  {packages
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
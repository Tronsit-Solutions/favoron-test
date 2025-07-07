import { DollarSign, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TravelerTipsOverviewProps {
  packages: any[];
}

const TravelerTipsOverview = ({ packages }: TravelerTipsOverviewProps) => {
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
    <Card className="bg-gradient-to-r from-success/10 to-success/5 border-success/30 mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-success">
          <DollarSign className="h-5 w-5" />
          💰 Resumen de Compensaciones - Tu Viaje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Tips */}
          <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-success">Total Ganado</p>
            </div>
            <p className="text-2xl font-bold text-success">${totalTips.toFixed(2)}</p>
            <p className="text-xs text-success/80 mt-1">
              {packagesWithTips} paquete{packagesWithTips !== 1 ? 's' : ''} confirmado{packagesWithTips !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Packages Count */}
          <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-primary">Paquetes Activos</p>
            </div>
            <p className="text-2xl font-bold text-primary">{packages.length}</p>
            <p className="text-xs text-primary/80 mt-1">
              Total asignados a tus viajes
            </p>
          </div>

          {/* Opportunities */}
          <div className="text-center p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-warning">Oportunidades</p>
            </div>
            <p className="text-2xl font-bold text-warning">{pendingQuotes}</p>
            <p className="text-xs text-warning/80 mt-1">
              Paquete{pendingQuotes !== 1 ? 's' : ''} esperando cotización
            </p>
          </div>
        </div>

        {/* Quick tip breakdown if there are multiple packages with tips */}
        {packagesWithTips > 1 && (
          <div className="mt-4 pt-4 border-t border-success/20">
            <p className="text-xs text-success/80 mb-2">Desglose por paquete:</p>
            <div className="grid gap-1 text-xs">
              {packages
                .filter(pkg => pkg.quote?.price)
                .map((pkg, index) => (
                  <div key={pkg.id} className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      Paquete #{index + 1}: {pkg.products?.[0]?.itemDescription || pkg.itemDescription}
                    </span>
                    <span className="font-medium text-success">
                      +${parseFloat(pkg.quote.price).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TravelerTipsOverview;
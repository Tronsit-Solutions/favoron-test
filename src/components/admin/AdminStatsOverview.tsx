import { Card, CardContent } from "@/components/ui/card";
import { Package, Plane, CheckCircle, Zap } from "lucide-react";


interface AdminStatsOverviewProps {
  packages: any[];
  trips: any[];
}

const AdminStatsOverview = ({ packages, trips }: AdminStatsOverviewProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-primary" />
            <div>
              <p className="text-2xl font-bold">{packages.length}</p>
              <p className="text-xs text-muted-foreground">Solicitudes totales</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Plane className="h-4 w-4 text-traveler" />
            <div>
              <p className="text-2xl font-bold">{trips.length}</p>
              <p className="text-xs text-muted-foreground">Viajes registrados</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{(() => {
                const now = Date.now();
                return packages.filter(pkg => {
                  // Must have a matched trip
                  if (!pkg.matched_trip_id) return false;
                  
                  // Exclude expired quotes (by status or by time)
                  const quoteExpiredByTime = pkg.status === 'quote_sent' && pkg.quote_expires_at && (new Date(pkg.quote_expires_at).getTime() < now);
                  const assignmentExpiredByTime = pkg.status === 'matched' && pkg.matched_assignment_expires_at && (new Date(pkg.matched_assignment_expires_at).getTime() < now);
                  
                  if (pkg.status === 'quote_expired' || quoteExpiredByTime || assignmentExpiredByTime) return false;
                  
                  return true;
                }).length;
              })()}</p>
              <p className="text-xs text-muted-foreground">Matches activos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{packages.filter(p => p.status === 'delivered').length}</p>
              <p className="text-xs text-muted-foreground">Entregados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default AdminStatsOverview;
import { Card, CardContent } from "@/components/ui/card";
import { Package, Plane, CheckCircle, Zap } from "lucide-react";

interface AdminStatsOverviewProps {
  packages: any[];
  trips: any[];
}

const AdminStatsOverview = ({ packages, trips }: AdminStatsOverviewProps) => {
  return (
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
              <p className="text-2xl font-bold">{packages.filter(p => p.status === 'matched').length}</p>
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
  );
};

export default AdminStatsOverview;
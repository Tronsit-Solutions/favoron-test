import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, Eye, EyeOff } from "lucide-react";

interface FilterOptions {
  showCancelled: boolean;
  showDelivered: boolean;
  showRejected: boolean;
}

interface DashboardFiltersProps {
  filters: FilterOptions;
  onToggleFilter: (filterName: keyof FilterOptions) => void;
  stats: {
    total: number;
    active: number;
    cancelled: number;
    delivered: number;
    rejected: number;
  };
}

const DashboardFilters = ({ filters, onToggleFilter, stats }: DashboardFiltersProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Filter className="h-4 w-4" />
          <span>Filtros de visualización</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-cancelled"
                checked={filters.showCancelled}
                onCheckedChange={() => onToggleFilter('showCancelled')}
              />
              <Label htmlFor="show-cancelled" className="flex items-center space-x-2 text-sm">
                {filters.showCancelled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>Cancelados</span>
              </Label>
            </div>
            <Badge variant="muted" className="text-xs">
              {stats.cancelled}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-delivered"
                checked={filters.showDelivered}
                onCheckedChange={() => onToggleFilter('showDelivered')}
              />
              <Label htmlFor="show-delivered" className="flex items-center space-x-2 text-sm">
                {filters.showDelivered ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>Entregados</span>
              </Label>
            </div>
            <Badge variant="success" className="text-xs">
              {stats.delivered}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-rejected"
                checked={filters.showRejected}
                onCheckedChange={() => onToggleFilter('showRejected')}
              />
              <Label htmlFor="show-rejected" className="flex items-center space-x-2 text-sm">
                {filters.showRejected ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>Rechazados</span>
              </Label>
            </div>
            <Badge variant="destructive" className="text-xs">
              {stats.rejected}
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Activos: {stats.active}</span>
            <span>Total: {stats.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
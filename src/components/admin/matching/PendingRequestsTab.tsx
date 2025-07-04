import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Zap, Eye, CalendarDays } from "lucide-react";

interface PendingRequestsTabProps {
  packages: any[];
  onOpenMatchDialog: (pkg: any) => void;
  onViewPackageDetail: (pkg: any) => void;
  availableTripsCount: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'quote_sent': return '💬';
    case 'payment_pending': return '💳';
    case 'payment_confirmed': return '✅';
    case 'in_transit': return '🚚';
    case 'delivered': return '📦';
    default: return '⏳';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'quote_sent': return 'bg-blue-100 text-blue-800';
    case 'payment_pending': return 'bg-yellow-100 text-yellow-800';
    case 'payment_confirmed': return 'bg-green-100 text-green-800';
    case 'in_transit': return 'bg-purple-100 text-purple-800';
    case 'delivered': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const PendingRequestsTab = ({ 
  packages, 
  onOpenMatchDialog, 
  onViewPackageDetail,
  availableTripsCount
}: PendingRequestsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const approvedPackages = packages.filter(p => p.status === 'approved');
  
  // Get unique destinations for filter
  const destinations = [...new Set(approvedPackages.map(pkg => pkg.packageDestination || 'Guatemala'))];

  // Filter packages based on search and filters
  const filteredPackages = approvedPackages.filter(pkg => {
    const matchesSearch = pkg.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pkg.userId || '').toString().includes(searchTerm);
    const matchesDestination = destinationFilter === "all" || pkg.packageDestination === destinationFilter;
    const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
    
    return matchesSearch && matchesDestination && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">📦 Solicitudes pendientes de Match</h3>
          <p className="text-sm text-muted-foreground">
            {filteredPackages.length} solicitudes aprobadas sin viaje asignado
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {availableTripsCount} viajes disponibles
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={destinationFilter} onValueChange={setDestinationFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por destino" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los destinos</SelectItem>
            {destinations.map(dest => (
              <SelectItem key={dest} value={dest}>{dest}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredPackages.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-muted-foreground">
                  {searchTerm || destinationFilter !== "all" || statusFilter !== "all" 
                    ? "No se encontraron solicitudes con los filtros aplicados"
                    : "No hay solicitudes pendientes de Match"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPackages.map(pkg => (
            <Card key={pkg.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    {/* Main info row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm leading-tight">{pkg.itemDescription}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            👤 Usuario: {pkg.userId}
                          </span>
                          <span className="text-xs font-medium text-primary">
                            ${pkg.estimatedPrice}
                          </span>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(pkg.status)}`}>
                        {getStatusIcon(pkg.status)} {pkg.status?.replace('_', ' ') || 'Pendiente'}
                      </Badge>
                    </div>

                    {/* Route info */}
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        🌎 {pkg.purchaseOrigin || 'País no especificado'}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                        🏠 {pkg.packageDestination || 'Guatemala'}
                      </span>
                    </div>

                    {/* Deadline */}
                    {pkg.deliveryDeadline && (
                      <div className="flex items-center space-x-1 text-xs">
                        <CalendarDays className="h-3 w-3 text-orange-500" />
                        <span className="text-orange-600">
                          Límite: {new Date(pkg.deliveryDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPackageDetail(pkg)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => onOpenMatchDialog(pkg)}
                      disabled={availableTripsCount === 0}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Match
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PendingRequestsTab;
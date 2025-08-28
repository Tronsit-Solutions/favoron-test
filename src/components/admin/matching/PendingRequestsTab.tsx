import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Zap, Eye, CalendarDays, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import RejectionTooltip from "@/components/admin/RejectionTooltip";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { usePackageHistory } from "@/hooks/usePackageHistory";
import { PackageHistoryIndicator } from "./PackageHistoryIndicator";

interface PendingRequestsTabProps {
  packages: any[];
  onOpenMatchDialog: (pkg: any) => void;
  onViewPackageDetail: (pkg: any) => void;
  onDiscardPackage: (pkg: any) => void;
  availableTripsCount: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return '✅';
    case 'quote_rejected': return '❌';
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
    case 'approved': return 'bg-green-100 text-green-800';
    case 'quote_rejected': return 'bg-red-100 text-red-800';
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
  onDiscardPackage,
  availableTripsCount
}: PendingRequestsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historyFilter, setHistoryFilter] = useState<'all' | 'new' | 'requoted'>('all');
  const { getStatusBadge } = useStatusHelpers();
  const { filterPackagesByHistory, getReQuoteStats } = usePackageHistory();

  // Filter packages for those that need matching (approved or quote rejected)
  const pendingPackages = packages.filter(p => p.status === 'approved' || p.status === 'quote_rejected');
  
  // Get unique destinations for filter
  const destinations = [...new Set(pendingPackages.map(pkg => pkg.package_destination || 'Guatemala'))];
  
  // Get statistics
  const reQuoteStats = getReQuoteStats(pendingPackages);

  // Apply history filter first
  const historyFilteredPackages = filterPackagesByHistory(pendingPackages, historyFilter);

  // Filter packages based on search and filters
  const filteredPackages = historyFilteredPackages.filter(pkg => {
    const matchesSearch = (pkg.item_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pkg.user_id || '').toString().includes(searchTerm);
    const matchesDestination = destinationFilter === "all" || pkg.package_destination === destinationFilter;
    const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
    
    return matchesSearch && matchesDestination && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg lg:text-xl font-semibold">📦 Solicitudes pendientes de Match</h3>
          <p className="text-sm lg:text-base text-muted-foreground">
            {filteredPackages.length} solicitudes (aprobadas y rechazadas) sin viaje asignado
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 lg:text-base lg:px-3 lg:py-1">
          {availableTripsCount} viajes disponibles
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
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

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Select value={historyFilter} onValueChange={(value: 'all' | 'new' | 'requoted') => setHistoryFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por historial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({reQuoteStats.total})</SelectItem>
              <SelectItem value="new">Nuevos ({reQuoteStats.new})</SelectItem>
              <SelectItem value="requoted">Re-cotizados ({reQuoteStats.expired + reQuoteStats.rejected})</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              📊 Nuevos: <Badge variant="secondary" className="text-xs">{reQuoteStats.new}</Badge>
            </span>
            <span className="flex items-center gap-1">
              🕐 Expirados: <Badge variant="secondary" className="text-xs">{reQuoteStats.expired}</Badge>
            </span>
            <span className="flex items-center gap-1">
              ❌ Rechazados: <Badge variant="secondary" className="text-xs">{reQuoteStats.rejected}</Badge>
            </span>
          </div>
        </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{pkg.item_description || "Sin descripción"}</h4>
                      {getStatusBadge(pkg.status, { 
                        packageDestination: pkg.package_destination,
                        rejectionReason: pkg.rejection_reason 
                      })}
                      <PackageHistoryIndicator package={pkg} />
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center space-x-1">
                        <span>🛍️</span>
                        <span>
                          {(pkg as any)?.profiles?.first_name && (pkg as any)?.profiles?.last_name 
                            ? `${(pkg as any).profiles.first_name} ${(pkg as any).profiles.last_name}` 
                            : (pkg as any)?.profiles?.username || 'Sin nombre'}
                        </span>
                      </span>
                      <span>📍 {pkg.purchase_origin} → {pkg.package_destination}</span>
                      {pkg.delivery_deadline && (
                        <span className="flex items-center space-x-1 text-orange-600">
                          <CalendarDays className="h-3 w-3" />
                          <span>Límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</span>
                        </span>
                      )}
                    </div>
                    {pkg.rejection_reason && pkg.wants_requote && (
                      <div className="mb-2">
                        <RejectionTooltip
                          adminAssignedTip={pkg.admin_assigned_tip}
                          rejectionReason={pkg.rejection_reason}
                          wantsRequote={pkg.wants_requote}
                          additionalNotes={pkg.additional_notes}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onViewPackageDetail(pkg)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Descartar solicitud
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. La solicitud será eliminada permanentemente 
                                y no se podrá recuperar.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => onDiscardPackage(pkg)}
                              >
                                Descartar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
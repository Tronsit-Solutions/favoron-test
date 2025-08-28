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
              <CardContent className="p-2 sm:p-3 lg:p-2">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-1">
                  <div className="flex-1 space-y-2 lg:space-y-1 min-w-0">
                    {/* Main info row */}
                    <div className="flex flex-col gap-2 lg:gap-1">
                       <div>
                         <div className="mb-1 lg:hidden">
                           <span className="text-xs text-muted-foreground font-medium">Descripción del producto:</span>
                         </div>
                          <h4 className="font-semibold text-sm lg:text-sm leading-tight mb-1 lg:mb-0 text-foreground break-words">
                            {pkg.item_description || "Sin descripción"}
                          </h4>
                           <div className="flex flex-col sm:flex-row lg:flex-row sm:items-center lg:items-center gap-1 sm:gap-3 lg:gap-2">
                               <span className="text-xs lg:text-xs text-muted-foreground break-words">
                                 🛍️ {(pkg as any)?.profiles?.first_name && (pkg as any)?.profiles?.last_name 
                                   ? `${(pkg as any).profiles.first_name} ${(pkg as any).profiles.last_name}` 
                                   : (pkg as any)?.profiles?.username || 'Sin nombre'}
                               </span>
                             <span className="text-xs lg:text-xs text-muted-foreground break-words">
                               📍 {pkg.purchase_origin} → {pkg.package_destination}
                             </span>
                          </div>
                       </div>
                       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:hidden">
                         <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                           <div className="flex items-center gap-2">
                             {getStatusBadge(pkg.status, { 
                               packageDestination: pkg.package_destination,
                               rejectionReason: pkg.rejection_reason 
                             })}
                             <PackageHistoryIndicator package={pkg} />
                           </div>
                           {pkg.rejection_reason && pkg.wants_requote && (
                             <RejectionTooltip
                               adminAssignedTip={pkg.admin_assigned_tip}
                               rejectionReason={pkg.rejection_reason}
                               wantsRequote={pkg.wants_requote}
                               additionalNotes={pkg.additional_notes}
                             />
                           )}
                         </div>
                       </div>
                    </div>

                    {/* Desktop badges - inline with content */}
                    <div className="hidden lg:flex items-center gap-1">
                      {getStatusBadge(pkg.status, { 
                        packageDestination: pkg.package_destination,
                        rejectionReason: pkg.rejection_reason 
                      })}
                      <PackageHistoryIndicator package={pkg} />
                      {pkg.rejection_reason && pkg.wants_requote && (
                        <RejectionTooltip
                          adminAssignedTip={pkg.admin_assigned_tip}
                          rejectionReason={pkg.rejection_reason}
                          wantsRequote={pkg.wants_requote}
                          additionalNotes={pkg.additional_notes}
                        />
                      )}
                    </div>

                     {/* Route info - more compact for desktop */}
                     <div className="flex flex-col sm:flex-row lg:flex-row sm:items-center lg:items-center gap-1 lg:gap-1 text-xs lg:text-xs">
                       <span className="bg-blue-50 text-blue-700 px-1 lg:px-2 py-0.5 lg:py-1 rounded text-xs lg:text-sm w-fit">
                         🌎 {pkg.purchase_origin || 'País no especificado'}
                       </span>
                       <span className="text-muted-foreground hidden sm:block">→</span>
                       <span className="bg-green-50 text-green-700 px-1 lg:px-2 py-0.5 lg:py-1 rounded text-xs lg:text-sm w-fit">
                         🏠 {pkg.package_destination || 'Guatemala'}
                       </span>
                     </div>

                     {/* Deadline - more compact */}
                     {pkg.delivery_deadline && (
                       <div className="flex items-center space-x-1 text-xs lg:text-sm">
                         <CalendarDays className="h-3 w-3 lg:h-4 lg:w-4 text-orange-500 flex-shrink-0" />
                         <span className="text-orange-600 break-words">
                           Límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                         </span>
                       </div>
                     )}
                  </div>

                  {/* Actions - Right side for desktop */}
                  <div className="flex flex-row lg:flex-row gap-1 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50 lg:border-none lg:ml-2">
                     <Button 
                       size="sm" 
                       variant="outline"
                       onClick={() => onViewPackageDetail(pkg)}
                       className="flex-1 lg:flex-none lg:h-8 lg:px-3 text-xs lg:text-sm"
                     >
                       <Eye className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-1 mr-1" />
                       <span className="lg:inline">Ver</span>
                     </Button>
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button 
                           size="sm" 
                           variant="outline"
                           className="flex-1 lg:flex-none lg:h-8 lg:w-8 lg:p-0 text-xs lg:text-sm"
                         >
                           <MoreHorizontal className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-0 mr-1" />
                           <span className="lg:hidden">Más</span>
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
                       className="bg-primary hover:bg-primary/90 flex-1 lg:flex-none lg:h-8 lg:px-3 text-xs lg:text-sm"
                     >
                       <Zap className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-1" />
                       <span className="lg:text-sm">Match</span>
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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Zap, Eye, CalendarDays, Trash2, XCircle, ExternalLink } from "lucide-react";
import RejectionReasonModal from "@/components/admin/RejectionReasonModal";

import RejectionTooltip from "@/components/admin/RejectionTooltip";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { usePackageHistory } from "@/hooks/usePackageHistory";
import { PackageHistoryIndicator } from "./PackageHistoryIndicator";
import { getDeliveryFee } from "@/lib/pricing";
import { getCountryLabel } from "@/lib/countries";

import { LoadMoreButton } from "@/components/admin/LoadMoreButton";

interface PendingRequestsTabProps {
  packages: any[];
  onOpenMatchDialog: (pkg: any) => void;
  onViewPackageDetail: (pkg: any) => void;
  onDiscardPackage: (pkg: any) => void;
  onRejectPackage: (pkgId: string, reason: string) => void;
  availableTripsCount: number;
  loadMorePackages?: () => Promise<void>;
  hasMorePackages?: boolean;
  totalPackages?: number;
}


const getRequestTypeBadge = (pkg: any) => {
  const requestType = pkg.products_data?.[0]?.requestType;
  
  if (requestType === 'personal') {
    return (
      <Badge className="bg-purple-100 text-purple-700 border-purple-300 text-xs">
        👤 Personal
      </Badge>
    );
  } else if (requestType === 'online') {
    return (
      <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300 text-xs">
        🛒 Online
      </Badge>
    );
  }
  return null;
};

const getProductLinks = (pkg: any) => {
  // Check for products_data (new format)
  if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
    return pkg.products_data
      .filter((p: any) => p.link)
      .map((p: any, index: number) => ({
        link: p.link,
        description: p.description || `Producto ${index + 1}`
      }));
  }
  
  // Fallback to item_link (legacy format)
  if (pkg.item_link) {
    return [{ link: pkg.item_link, description: pkg.item_description || 'Ver producto' }];
  }
  
  return [];
};

const PendingRequestsTab = ({ 
  packages, 
  onOpenMatchDialog, 
  onViewPackageDetail,
  onDiscardPackage,
  onRejectPackage,
  availableTripsCount,
  loadMorePackages,
  hasMorePackages = false,
  totalPackages = 0
}: PendingRequestsTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [historyFilter, setHistoryFilter] = useState<'all' | 'new' | 'requoted'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'personal'>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'expired' | 'active'>('all');
  const [originFilter, setOriginFilter] = useState("all");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [packageToReject, setPackageToReject] = useState<any>(null);
  const { getStatusBadge } = useStatusHelpers();
  const { filterPackagesByHistory, getReQuoteStats } = usePackageHistory();

  // Filter packages for those that need matching (approved or quote rejected)
  const pendingPackages = packages.filter(p => p.status === 'approved' || p.status === 'quote_rejected');
  
  // Get unique destinations for filter
  const destinations = [...new Set(pendingPackages.map(pkg => pkg.package_destination || 'Guatemala'))];
  
  // Get unique origins for filter
  const origins = [...new Set(pendingPackages.map(pkg => pkg.purchase_origin).filter(Boolean))];
  
  // Get statistics
  const reQuoteStats = getReQuoteStats(pendingPackages);
  
  // Calculate deadline stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiredCount = pendingPackages.filter(pkg => {
    if (!pkg.delivery_deadline) return false;
    const deadline = new Date(pkg.delivery_deadline);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  }).length;
  const activeCount = pendingPackages.length - expiredCount;

  // Apply history filter first
  const historyFilteredPackages = filterPackagesByHistory(pendingPackages, historyFilter);

  // Filter packages based on search and filters
  const filteredPackages = historyFilteredPackages.filter(pkg => {
    const searchLower = searchTerm.toLowerCase();
    const userFirstName = ((pkg as any)?.profiles?.first_name || '').toLowerCase();
    const userLastName = ((pkg as any)?.profiles?.last_name || '').toLowerCase();
    const userName = `${userFirstName} ${userLastName}`.trim();
    const username = ((pkg as any)?.profiles?.username || '').toLowerCase();
    
    const matchesSearch = (pkg.item_description || '').toLowerCase().includes(searchLower) ||
                         userFirstName.includes(searchLower) ||
                         userLastName.includes(searchLower) ||
                         userName.includes(searchLower) ||
                         username.includes(searchLower);
    const matchesDestination = destinationFilter === "all" || pkg.package_destination === destinationFilter;
    const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
    
    // Type filter
    const pkgType = pkg.products_data?.[0]?.requestType;
    const matchesType = typeFilter === "all" || pkgType === typeFilter;
    
    // Deadline filter
    const pkgDeadline = pkg.delivery_deadline ? new Date(pkg.delivery_deadline) : null;
    if (pkgDeadline) pkgDeadline.setHours(0, 0, 0, 0);
    const isExpired = pkgDeadline ? pkgDeadline < today : false;
    const matchesDeadline = deadlineFilter === "all" || 
      (deadlineFilter === "expired" && isExpired) ||
      (deadlineFilter === "active" && !isExpired);
    
    // Origin filter
    const matchesOrigin = originFilter === "all" || pkg.purchase_origin === originFilter;
    
    return matchesSearch && matchesDestination && matchesStatus && matchesType && matchesDeadline && matchesOrigin;
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

          <Select value={typeFilter} onValueChange={(value: 'all' | 'online' | 'personal') => setTypeFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo de pedido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="online">🛒 Compra en Línea</SelectItem>
              <SelectItem value="personal">📦 Ya Tengo el Paquete</SelectItem>
            </SelectContent>
          </Select>

          <Select value={deadlineFilter} onValueChange={(value: 'all' | 'expired' | 'active') => setDeadlineFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por fecha límite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="expired">⏰ Expiradas ({expiredCount})</SelectItem>
              <SelectItem value="active">✅ Vigentes ({activeCount})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="País de origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los orígenes</SelectItem>
              {origins.map(origin => (
                <SelectItem key={origin} value={origin}>📦 {origin}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredPackages.length === 0 ? (
          <div className="flex items-center justify-center py-8 border rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-muted-foreground">
                {searchTerm || destinationFilter !== "all" || statusFilter !== "all" 
                  ? "No se encontraron solicitudes con los filtros aplicados"
                  : "No hay solicitudes pendientes de Match"
                }
              </p>
            </div>
          </div>
        ) : (
          filteredPackages.map(pkg => (
            <div key={pkg.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 sm:gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {getRequestTypeBadge(pkg)}
                  <p className="font-medium">
                    {pkg.item_description || "Sin descripción"}
                  </p>
                  {getStatusBadge(pkg.status, { 
                    packageDestination: pkg.package_destination,
                    rejectionReason: pkg.rejection_reason 
                  })}
                  <PackageHistoryIndicator package={pkg} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Precio: ${pkg.estimated_price || 'No cotizado'} • Usuario: {(pkg as any)?.profiles?.first_name && (pkg as any)?.profiles?.last_name 
                    ? `${(pkg as any).profiles.first_name} ${(pkg as any).profiles.last_name}` 
                    : (pkg as any)?.profiles?.username || 'Sin nombre'}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  📦 Origen: {pkg.purchase_origin || 'No especificado'} → 🎯 Destino: {pkg.package_destination_country 
                    ? `${getCountryLabel(pkg.package_destination_country) || pkg.package_destination_country}, ${pkg.package_destination}`
                    : pkg.package_destination || 'Guatemala'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Entrega: {pkg.delivery_method === 'delivery' 
                    ? `🚚 Envío a domicilio (+Q${getDeliveryFee(pkg.delivery_method, (pkg as any)?.profiles?.trust_level, (pkg.confirmed_delivery_address as any)?.cityArea)})` 
                    : '🏢 Recojo en zona 14'}
                  {pkg.delivery_deadline && (
                    <span className={`ml-2 ${new Date(pkg.delivery_deadline).setHours(0,0,0,0) < today.getTime() ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                      • Límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                    </span>
                  )}
                </p>
                {/* Product Links */}
                {(() => {
                  const productLinks = getProductLinks(pkg);
                  if (productLinks.length === 0) return null;
                  
                  return (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {productLinks.slice(0, 3).map((product: any, idx: number) => (
                        <a
                          key={idx}
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {productLinks.length === 1 ? 'Ver producto' : `Producto ${idx + 1}`}
                        </a>
                      ))}
                      {productLinks.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{productLinks.length - 3} más
                        </span>
                      )}
                    </div>
                  );
                })()}
                {pkg.delivery_deadline && new Date(pkg.delivery_deadline).setHours(0,0,0,0) < today.getTime() && (
                  <Badge className="bg-red-100 text-red-700 border-red-300 text-xs mt-1">
                    ⏰ Fecha límite expirada
                  </Badge>
                )}
                {/* Rejected Traveler Badge */}
                {(pkg.quote_rejection as any)?.rejected_traveler && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs mt-1">
                    🔄 Rechazo previo: {(pkg.quote_rejection as any).rejected_traveler.traveler_name}
                  </Badge>
                )}
                {pkg.rejection_reason && pkg.wants_requote && (
                  <div className="mt-2">
                    <RejectionTooltip
                      adminAssignedTip={pkg.admin_assigned_tip}
                      rejectionReason={pkg.rejection_reason}
                      wantsRequote={pkg.wants_requote}
                      additionalNotes={pkg.additional_notes}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0 w-full sm:w-auto">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onViewPackageDetail(pkg)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalles
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-orange-600 hover:text-orange-600"
                  onClick={() => {
                    setPackageToReject(pkg);
                    setShowRejectModal(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Descartar
                    </Button>
                  </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción marcará la solicitud como cancelada. La solicitud permanecerá 
                          en el historial pero no aparecerá más en las solicitudes pendientes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              console.log('🔥 Discard button clicked for package:', pkg);
                              onDiscardPackage(pkg);
                            }}
                          >
                            Marcar como Cancelada
                          </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button 
                  size="sm" 
                  onClick={() => onOpenMatchDialog(pkg)}
                  disabled={availableTripsCount === 0}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Hacer Match
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {loadMorePackages && (
        <LoadMoreButton
          onLoadMore={async () => {
            setIsLoadingMore(true);
            await loadMorePackages();
            setIsLoadingMore(false);
          }}
          hasMore={hasMorePackages}
          isLoading={isLoadingMore}
          currentCount={packages.length}
          totalCount={totalPackages}
        />
      )}

      {/* Rejection Modal */}
      <RejectionReasonModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setPackageToReject(null);
        }}
        onConfirm={(reason) => {
          if (packageToReject) {
            onRejectPackage(packageToReject.id, reason);
          }
          setShowRejectModal(false);
          setPackageToReject(null);
        }}
        type="package"
        itemName={packageToReject?.item_description || packageToReject?.products_data?.[0]?.itemDescription || 'Solicitud'}
      />
    </div>
  );
};

export default PendingRequestsTab;
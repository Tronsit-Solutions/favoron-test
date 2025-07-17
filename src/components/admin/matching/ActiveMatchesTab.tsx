import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, CalendarDays, Link as LinkIcon, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { PackageTimeline } from "@/components/chat/PackageTimeline";

interface ActiveMatchesTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onConfirmOfficeReception: (packageId: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const getStatusInfo = (status: string) => {
  const statusMap = {
    'quote_sent': { icon: '💬', label: 'Cotización enviada', color: 'bg-blue-100 text-blue-800' },
    'payment_pending': { icon: '💳', label: 'Pago pendiente', color: 'bg-yellow-100 text-yellow-800' },
    'payment_confirmed': { icon: '✅', label: 'Pago confirmado', color: 'bg-green-100 text-green-800' },
    'in_transit': { icon: '🚚', label: 'En tránsito', color: 'bg-purple-100 text-purple-800' },
    'delivered': { icon: '📦', label: 'Entregado', color: 'bg-emerald-100 text-emerald-800' },
    'completed': { icon: '🎉', label: 'Completado', color: 'bg-emerald-100 text-emerald-800' },
    'rejected': { icon: '❌', label: 'Match roto', color: 'bg-red-100 text-red-800' },
    'quote_rejected': { icon: '❌', label: 'Cotización rechazada', color: 'bg-red-100 text-red-800' }
  };
  return statusMap[status] || { icon: '⏳', label: 'Pendiente', color: 'bg-gray-100 text-gray-800' };
};

const ActiveMatchesTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail,
  onConfirmOfficeReception,
  getStatusBadge 
}: ActiveMatchesTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedChatPackage, setSelectedChatPackage] = useState<any>(null);

  const matchedPackages = packages.filter(pkg => pkg.matched_trip_id);
  
  // Get unique statuses for filter
  const statuses = [...new Set(matchedPackages.map(pkg => pkg.status))];

  // Filter packages based on search and filters
  const filteredMatches = matchedPackages.filter(pkg => {
    const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
    const matchesSearch = 
      (pkg.item_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.user_id || '').toString().includes(searchTerm) ||
      (matchedTrip?.from_city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (matchedTrip?.to_city || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">🔗 Matches activos</h3>
          <p className="text-sm text-muted-foreground">
            {filteredMatches.length} matches en seguimiento
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="bg-green-50 text-green-700">
            {matchedPackages.filter(p => p.status === 'completed').length} Completados
          </Badge>
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">
            {matchedPackages.filter(p => ['payment_pending', 'in_transit'].includes(p.status)).length} En proceso
          </Badge>
          <Badge variant="secondary" className="bg-red-50 text-red-700">
            {matchedPackages.filter(p => ['rejected', 'quote_rejected'].includes(p.status)).length} Matches rotos
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, usuario o ruta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {statuses.map(status => {
              const info = getStatusInfo(status);
              return (
                <SelectItem key={status} value={status}>
                  {info.icon} {info.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl mb-2">🔗</div>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "No se encontraron matches con los filtros aplicados"
                    : "No hay matches activos"
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map(pkg => {
            const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
            const statusInfo = getStatusInfo(pkg.status);
            
            // Debug: Log package info to see current status
            console.log('Package debug:', {
              id: pkg.id,
              status: pkg.status,
              rejectionReason: pkg.rejectionReason,
              quote: pkg.quote
            });
            
            return (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      {/* Header with status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm leading-tight">{pkg.item_description}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              👤 Shopper: {pkg.user_id}
                            </span>
                            <span className="text-xs font-medium text-primary">
                              ${pkg.estimated_price}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              📅 Match: {new Date(pkg.updated_at).toLocaleDateString('es-GT')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={`text-xs ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Actualizado: {new Date(pkg.updated_at).toLocaleString('es-GT')}
                          </div>
                        </div>
                      </div>

                      {/* Current Status */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Estado Actual</span>
                          <span className="text-xs text-gray-500">
                            ID: {pkg.id.split('-')[0]}...
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            ['rejected', 'quote_rejected'].includes(pkg.status) 
                              ? 'bg-red-500' 
                              : pkg.status === 'completed' 
                              ? 'bg-green-500' 
                              : 'bg-yellow-500 animate-pulse'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">
                                {statusInfo.icon} {statusInfo.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(pkg.updated_at).toLocaleDateString('es-GT')}
                              </span>
                            </div>
                            {pkg.status === 'quote_sent' && pkg.quote && (
                              <p className="text-xs text-gray-600 mt-1">
                                💰 Cotización: Q{(parseFloat(pkg.quote.price || 0) + parseFloat(pkg.quote.serviceFee || 0)).toFixed(2)}
                              </p>
                            )}
                            {pkg.status === 'payment_confirmed' && (
                              <p className="text-xs text-gray-600 mt-1">
                                ✅ Listo para envío
                              </p>
                            )}
                            {pkg.status === 'in_transit' && (
                              <p className="text-xs text-gray-600 mt-1">
                                🚚 {pkg.tracking_info ? 'Con seguimiento' : 'En camino'}
                              </p>
                            )}
                            {pkg.status === 'delivered_to_office' && (
                              <p className="text-xs text-gray-600 mt-1">
                                🏢 Esperando al viajero
                              </p>
                            )}
                            {['rejected', 'quote_rejected'].includes(pkg.status) && pkg.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1">
                                📝 {typeof pkg.rejectionReason === 'string' ? pkg.rejectionReason : pkg.rejectionReason.value}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                       {/* Match info */}
                       {matchedTrip && !['rejected', 'quote_rejected'].includes(pkg.status) && (
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                           <div className="flex items-center space-x-2 mb-2">
                             <LinkIcon className="h-3 w-3 text-blue-600" />
                             <span className="text-xs font-medium text-blue-800">Match activo</span>
                           </div>
                           <div className="text-xs text-blue-700">
                              <p>🛫 {matchedTrip.from_city} → {matchedTrip.to_city}</p>
                              <p>👤 Viajero: {matchedTrip.user_id}</p>
                           </div>
                         </div>
                       )}

                       {/* Rejected Match info */}
                       {matchedTrip && ['rejected', 'quote_rejected'].includes(pkg.status) && (
                         <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                           <div className="flex items-center space-x-2 mb-2">
                             <XCircle className="h-3 w-3 text-red-600" />
                             <span className="text-xs font-medium text-red-800">
                               {pkg.status === 'quote_rejected' ? 'Cotización rechazada' : 'Match roto'}
                             </span>
                           </div>
                           <div className="text-xs text-red-700 space-y-1">
                              <p>🛫 {matchedTrip.from_city} → {matchedTrip.to_city}</p>
                              <p>👤 Viajero: {matchedTrip.user_id}</p>
                             {pkg.rejectionReason && typeof pkg.rejectionReason === 'string' && (
                               <p className="font-medium">📝 Razón: {pkg.rejectionReason}</p>
                             )}
                             {pkg.rejectionReason && typeof pkg.rejectionReason === 'object' && pkg.rejectionReason.value && (
                               <p className="font-medium">📝 Razón: {pkg.rejectionReason.value}</p>
                             )}
                           </div>
                         </div>
                       )}

                      {/* Financial info */}
                      {pkg.quote && (
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                            💰 Cotización: Q{(parseFloat(pkg.quote.price || 0) + parseFloat(pkg.quote.serviceFee || 0)).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Important dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                         {pkg.delivery_deadline && (
                           <div className="flex items-center space-x-1">
                             <CalendarDays className="h-3 w-3 text-orange-500" />
                             <span className="text-orange-600">
                               Límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                             </span>
                           </div>
                        )}
                        
                         {matchedTrip?.delivery_date && (
                           <div className="flex items-center space-x-1">
                             <CalendarDays className="h-3 w-3 text-purple-500" />
                             <span className="text-purple-600">
                               Entrega: {new Date(matchedTrip.delivery_date).toLocaleDateString('es-GT')}
                             </span>
                           </div>
                        )}
                      </div>
                    </div>

                     {/* Actions */}
                     <div className="ml-4 space-y-2">
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
                         onClick={() => setSelectedChatPackage(pkg)}
                         className="w-full"
                       >
                         <MessageCircle className="h-4 w-4 mr-1" />
                         Ver Chat
                       </Button>
                       
                       {pkg.status === 'received_by_traveler' && (
                         <Button 
                           size="sm" 
                           onClick={() => onConfirmOfficeReception(pkg.id)}
                           className="w-full"
                         >
                           <CheckCircle className="h-4 w-4 mr-1" />
                           Confirmar recepción en oficina
                         </Button>
                       )}
                     </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Chat Modal */}
      <Dialog open={!!selectedChatPackage} onOpenChange={() => setSelectedChatPackage(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Chat del Match</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedChatPackage && (
            <div className="flex-1 overflow-hidden">
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{selectedChatPackage.item_description}</p>
                    <p className="text-xs text-muted-foreground">
                      Shopper: {selectedChatPackage.user_id} | 
                      {selectedChatPackage.matched_trip_id && (
                        <span> Viajero: {trips.find(t => t.id === selectedChatPackage.matched_trip_id)?.user_id}</span>
                      )}
                    </p>
                  </div>
                  <Badge className={`text-xs ${getStatusInfo(selectedChatPackage.status).color}`}>
                    {getStatusInfo(selectedChatPackage.status).icon} {getStatusInfo(selectedChatPackage.status).label}
                  </Badge>
                </div>
              </div>
              
              <div className="h-[500px] overflow-hidden">
                <PackageTimeline 
                  pkg={selectedChatPackage} 
                  className="h-full"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveMatchesTab;
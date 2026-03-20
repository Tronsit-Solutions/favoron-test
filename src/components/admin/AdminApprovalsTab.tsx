
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { formatFullName } from "@/lib/formatters";
import RejectionReasonModal from "./RejectionReasonModal";
import { getDeliveryFee } from "@/lib/pricing";
import { getCountryLabel } from "@/lib/countries";
interface AdminApprovalsTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onViewTripDetail: (trip: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject', reason?: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminApprovalsTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onViewTripDetail, 
  onApproveReject, 
  getStatusBadge 
}: AdminApprovalsTabProps) => {
  const [activeTab, setActiveTab] = useState("packages");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<{ type: 'package' | 'trip'; id: string; name: string } | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleAction = async (type: 'package' | 'trip', id: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await onApproveReject(type, id, action, reason);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const pendingPackages = packages.filter(p => p.status === 'pending_approval');
  const pendingTrips = trips.filter(t => t.status === 'pending_approval');

  // Debug: Log the packages data with MORE detail
  console.log('🔍 AdminApprovalsTab Debug - PACKAGES:', {
    totalPackages: packages.length,
    pendingPackages: pendingPackages.length,
    allPackagesWithStatus: packages.map(p => ({ 
      id: p.id, 
      description: p.item_description, 
      status: p.status,
      user_id: p.user_id,
      created_at: p.created_at 
    })),
    pendingPackageDetails: pendingPackages.map(p => ({ 
      id: p.id, 
      description: p.item_description, 
      status: p.status,
      user_id: p.user_id,
      created_at: p.created_at 
    }))
  });

  // Debug: Log the trips data with DETAILED structure
  console.log('🔍 AdminApprovalsTab Debug - TRIPS:', {
    totalTrips: trips.length,
    pendingTrips: pendingTrips.length,
    allTripsWithProfiles: trips.map(t => ({ 
      id: t.id, 
      from_city: t.from_city,
      to_city: t.to_city,
      status: t.status,
      user_id: t.user_id,
      profiles: t.profiles,
      hasProfiles: !!(t as any).profiles,
      profilesStructure: (t as any).profiles ? {
        first_name: (t as any).profiles.first_name,
        last_name: (t as any).profiles.last_name,
        username: (t as any).profiles.username,
        email: (t as any).profiles.email,
        phone_number: (t as any).profiles.phone_number
      } : null,
      created_at: t.created_at 
    })),
    pendingTripDetails: pendingTrips.map(t => ({ 
      id: t.id, 
      from_city: t.from_city,
      to_city: t.to_city,
      status: t.status,
      user_id: t.user_id,
      profiles: t.profiles,
      hasProfiles: !!(t as any).profiles,
      profilesData: (t as any).profiles,
      formatFullNameResult: (t as any).profiles ? 
        formatFullName((t as any).profiles.first_name, (t as any).profiles.last_name) : 'NO_PROFILES',
      created_at: t.created_at 
    }))
  });

  // Helper function to get traveler display name
  const getTravelerDisplayName = (trip: any) => {
    console.log('🔍 Getting traveler name for trip:', trip.id, {
      profiles: trip.profiles,
      user_id: trip.user_id,
      hasProfiles: !!trip.profiles
    });
    
    if (trip.profiles) {
      // First try display_name from trips_with_user
      if (trip.profiles.display_name) {
        console.log('✅ Using display_name:', trip.profiles.display_name);
        return trip.profiles.display_name;
      }
      
      const fullName = formatFullName(trip.profiles.first_name, trip.profiles.last_name);
      if (fullName && fullName !== 'Usuario') {
        console.log('✅ Using full name:', fullName);
        return fullName;
      }
      if (trip.profiles.username) {
        console.log('✅ Using username:', trip.profiles.username);
        return trip.profiles.username;
      }
      if (trip.profiles.email) {
        console.log('✅ Using email:', trip.profiles.email);
        return trip.profiles.email;
      }
    }
    
    const fallback = `Usuario ${String(trip.user_id || '').slice(0, 8)}...`;
    console.log('⚠️ No profile data available, using fallback:', fallback);
    return fallback;
  };

  // Helper function to get shopper display name
  const getShopperDisplayName = (pkg: any) => {
    console.log('🔍 Getting shopper name for package:', pkg.id, {
      profiles: pkg.profiles,
      user_id: pkg.user_id,
      hasProfiles: !!pkg.profiles
    });
    
    if (pkg.profiles) {
      const fullName = formatFullName(pkg.profiles.first_name, pkg.profiles.last_name);
      if (fullName && fullName !== 'Usuario') {
        console.log('✅ Using full name:', fullName);
        return fullName;
      }
      if (pkg.profiles.username) {
        console.log('✅ Using username:', pkg.profiles.username);
        return pkg.profiles.username;
      }
      if (pkg.profiles.email) {
        console.log('✅ Using email:', pkg.profiles.email);
        return pkg.profiles.email;
      }
    }
    
    const fallback = `Usuario ${pkg.user_id.slice(0, 8)}...`;
    console.log('⚠️ Using fallback:', fallback);
    return fallback;
  };

  const handleReject = (type: 'package' | 'trip', id: string, name: string) => {
    setRejectionTarget({ type, id, name });
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async (reason: string) => {
    if (rejectionTarget) {
      await handleAction(rejectionTarget.type, rejectionTarget.id, 'reject', reason);
      setShowRejectionModal(false);
      setRejectionTarget(null);
    }
  };

  const handleCancelRejection = () => {
    setShowRejectionModal(false);
    setRejectionTarget(null);
  };

  // Helper function to check if package is a return
  const isReturnPackage = (pkg: any): boolean => {
    if (pkg.delivery_method === 'return_dropoff' || pkg.delivery_method === 'return_pickup') {
      return true;
    }
    if (pkg.purchase_origin === 'Guatemala') {
      return true;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pendingPackages.length}</div>
              <div className="text-xs text-muted-foreground">Solicitudes Pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{pendingTrips.length}</div>
              <div className="text-xs text-muted-foreground">Viajes Pendientes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages" className="relative">
            📦 Solicitudes
            {pendingPackages.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {pendingPackages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trips" className="relative">
            ✈️ Viajes
            {pendingTrips.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {pendingTrips.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Pendientes de Aprobación</CardTitle>
              <CardDescription>Revisa y aprueba las nuevas solicitudes de paquetes</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPackages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-muted-foreground">No hay solicitudes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPackages.map(pkg => (
                    <div key={pkg.id} className={`border rounded-lg p-3 sm:p-4 space-y-3 relative transition-opacity ${processingIds.has(pkg.id) ? 'opacity-50 pointer-events-none' : ''}`}>
                      {processingIds.has(pkg.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                        <div className="flex-1 space-y-1">
                          <h4 className={`font-medium text-sm sm:text-base break-words ${
                            pkg.products_data?.[0]?.requestType === 'personal' ? 'text-blue-600 dark:text-blue-400' : ''
                          }`}>
                            {pkg.item_description}
                            {isReturnPackage(pkg) && (
                              <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                🔄 Devolución
                              </Badge>
                            )}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            Precio estimado: ${pkg.estimated_price || 0} • Usuario: {getShopperDisplayName(pkg)}
                          </p>
                          {pkg.profiles && (
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              Email: {pkg.profiles.email || 'Sin email'} • Tel: {pkg.profiles.phone_number || 'Sin teléfono'}
                            </p>
                          )}
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                             Origen: {pkg.purchase_origin} → Destino: {
                               pkg.package_destination_country 
                                 ? `${getCountryLabel(pkg.package_destination_country) || pkg.package_destination_country}${pkg.package_destination ? `, ${pkg.package_destination}` : ''}`
                                 : (pkg.package_destination || 'No especificado')
                             }
                           </p>
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                             Fecha límite: {(() => {
                               const date = new Date(pkg.delivery_deadline);
                               return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT');
                             })()}
                           </p>
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                             Método de entrega: {pkg.delivery_method === 'delivery' 
                               ? `🚚 Envío a domicilio (+Q${getDeliveryFee(pkg.delivery_method, pkg.profiles?.trust_level, (pkg.confirmed_delivery_address as any)?.cityArea)})` 
                               : pkg.delivery_method === 'return_dropoff'
                                 ? '📦 Punto de devolución (UPS/FedEx)'
                                 : pkg.delivery_method === 'return_pickup'
                                   ? '🚛 Pickup por carrier'
                                   : '🏢 Recojo en zona 14'}
                           </p>
                          {pkg.item_link && (
                            <p className="text-xs sm:text-sm break-words">
                              <strong>Link:</strong>{' '}
                              <a href={pkg.item_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                Ver producto
                              </a>
                            </p>
                          )}
                          {pkg.additional_notes && (
                            <p className="text-xs sm:text-sm break-words">
                              <strong>Notas:</strong> {pkg.additional_notes}
                            </p>
                          )}
                          {/* Indicador de empaque original */}
                          {pkg.products_data && pkg.products_data.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              📦 {pkg.products_data.some((p: any) => p.needsOriginalPackaging) 
                                ? 'Conservar empaque original' 
                                : 'No requiere empaque original'}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 self-start">
                          {getStatusBadge(pkg.status)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end pt-3 border-t border-border/50">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewPackageDetail(pkg)}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleAction('package', pkg.id, 'approve')}
                            disabled={processingIds.has(pkg.id)}
                            className="flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Aprobar
                          </Button>
                           <Button 
                             size="sm" 
                             variant="destructive"
                             onClick={() => handleReject('package', pkg.id, pkg.item_description)}
                             className="flex-1 sm:flex-none text-xs sm:text-sm"
                           >
                             <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                             Rechazar
                           </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Viajes Pendientes de Aprobación</CardTitle>
              <CardDescription>Revisa y aprueba los nuevos registros de viajes</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTrips.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-muted-foreground">No hay viajes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTrips.map(trip => (
                    <div key={trip.id} className={`border rounded-lg p-3 sm:p-4 space-y-3 relative transition-opacity ${processingIds.has(trip.id) ? 'opacity-50 pointer-events-none' : ''}`}>
                      {processingIds.has(trip.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg z-10">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">{trip.from_city} → {trip.to_city}</h4>
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              Llegada: {(() => {
                                const date = new Date(trip.arrival_date);
                                return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT');
                              })()} • 
                              Entrega: {(() => {
                                const date = new Date(trip.delivery_date);
                                return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toLocaleDateString('es-GT');
                              })()}
                           </p>
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              Viajero: {trip.traveler_display_name || trip.user_display_name || trip.profiles?.display_name || `${trip.first_name || ''} ${trip.last_name || ''}`.trim() || trip.username || trip.email || `Usuario ${trip.user_id?.slice(0, 8)}`}
                              {trip.boost_code && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] ml-1">
                                  🚀 Boost: {trip.boost_code}
                                </Badge>
                              )}
                             </p>
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                             Recepción paquetes: {(() => {
                               const dateFirst = new Date(trip.first_day_packages);
                               const dateLast = new Date(trip.last_day_packages);
                               return `${new Date(dateFirst.getUTCFullYear(), dateFirst.getUTCMonth(), dateFirst.getUTCDate()).toLocaleDateString('es-GT')} - ${new Date(dateLast.getUTCFullYear(), dateLast.getUTCMonth(), dateLast.getUTCDate()).toLocaleDateString('es-GT')}`;
                             })()}
                           </p>
                        </div>
                        <div className="flex-shrink-0 self-start">
                          {getStatusBadge(trip.status)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end pt-3 border-t border-border/50">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewTripDetail(trip)}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="success"
                            onClick={() => handleAction('trip', trip.id, 'approve')}
                            disabled={processingIds.has(trip.id)}
                            className="flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Aprobar
                          </Button>
                           <Button 
                             size="sm" 
                             variant="destructive"
                             onClick={() => handleReject('trip', trip.id, `${trip.from_city} → ${trip.to_city}`)}
                             className="flex-1 sm:flex-none text-xs sm:text-sm"
                           >
                             <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                             Rechazar
                           </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RejectionReasonModal 
        isOpen={showRejectionModal}
        onClose={handleCancelRejection}
        onConfirm={handleConfirmRejection}
        type={rejectionTarget?.type || 'package'}
        itemName={rejectionTarget?.name || ''}
      />
    </div>
  );
};

export default AdminApprovalsTab;

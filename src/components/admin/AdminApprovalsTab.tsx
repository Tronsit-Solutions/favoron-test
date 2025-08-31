import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { formatFullName } from "@/lib/formatters";

interface AdminApprovalsTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onViewTripDetail: (trip: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject') => void;
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
                    <div key={pkg.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">
                            {pkg.item_description}
                          </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              Precio estimado: ${pkg.estimated_price || 0} • Usuario: {(pkg as any).profiles ? 
                                formatFullName((pkg as any).profiles.first_name, (pkg as any).profiles.last_name) || (pkg as any).profiles.username || `Usuario ${pkg.user_id.slice(0, 8)}...`
                                : `Usuario ${pkg.user_id.slice(0, 8)}...`}
                            </p>
                            {(pkg as any).profiles && (
                              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                Email: {(pkg as any).profiles.email || 'Sin email'} • Tel: {(pkg as any).profiles.phone_number || 'Sin teléfono'}
                              </p>
                            )}
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                             Origen: {pkg.purchase_origin} → Destino: {pkg.package_destination}
                           </p>
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                             Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                           </p>
                           <p className="text-xs sm:text-sm text-muted-foreground break-words">
                             Método de entrega: {pkg.delivery_method === 'delivery' ? '🚚 Envío a domicilio (+Q25)' : '🏢 Recojo en zona 14'}
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
                            onClick={() => onApproveReject('package', pkg.id, 'approve')}
                            className="flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => onApproveReject('package', pkg.id, 'reject')}
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
                    <div key={trip.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">{trip.from_city} → {trip.to_city}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            Llegada: {new Date(trip.arrival_date).toLocaleDateString('es-GT')} • 
                            Salida: {new Date(trip.departure_date).toLocaleDateString('es-GT')}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            Viajero: {(trip as any).profiles ? 
                              formatFullName((trip as any).profiles.first_name, (trip as any).profiles.last_name) || (trip as any).profiles.username || `Usuario ${trip.user_id.slice(0, 8)}...`
                              : `Usuario ${trip.user_id.slice(0, 8)}...`}
                          </p>
                          {(trip as any).profiles && (
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">
                              Email: {(trip as any).profiles.email || 'Sin email'} • Tel: {(trip as any).profiles.phone_number || 'Sin teléfono'}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            Entrega: {new Date(trip.delivery_date).toLocaleDateString('es-GT')}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            Recepción paquetes: {new Date(trip.first_day_packages).toLocaleDateString('es-GT')} - {new Date(trip.last_day_packages).toLocaleDateString('es-GT')}
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
                            onClick={() => onApproveReject('trip', trip.id, 'approve')}
                            className="flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => onApproveReject('trip', trip.id, 'reject')}
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
    </div>
  );
};

export default AdminApprovalsTab;

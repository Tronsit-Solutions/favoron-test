import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle } from "lucide-react";
import PendingRequestsTab from "./matching/PendingRequestsTab";
import AvailableTripsTab from "./matching/AvailableTripsTab";
import ActiveMatchesTab from "./matching/ActiveMatchesTab";
import PaymentsTab from "./matching/PaymentsTab";

interface AdminMatchingTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onViewTripDetail: (trip: any) => void;
  onOpenMatchDialog: (pkg: any) => void;
  onDiscardPackage: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onConfirmOfficeReception: (packageId: string) => void;
  onConfirmDeliveryComplete: (packageId: string) => void;
  onAdminConfirmOfficeDelivery: (packageId: string) => void;
  onConfirmShopperReceived: (packageId: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminMatchingTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onViewTripDetail, 
  onOpenMatchDialog, 
  onDiscardPackage,
  onUpdateStatus, 
  onConfirmOfficeReception,
  onConfirmDeliveryComplete,
  onAdminConfirmOfficeDelivery,
  onConfirmShopperReceived,
  getStatusBadge 
}: AdminMatchingTabProps) => {
  const [activeTab, setActiveTab] = useState("pending");

  // Calculate stats
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  const activeMatches = packages.filter(pkg => pkg.matchedTripId);
  const rejectedQuotes = packages.filter(p => p.status === 'quote_rejected');
  const pendingPayments = packages.filter(pkg => 
    (pkg.status === 'payment_pending_approval' || pkg.status === 'payment_confirmed') && pkg.payment_receipt
  );

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{approvedPackages.length}</div>
              <div className="text-xs text-muted-foreground">Pendientes de Match</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{availableTrips.length}</div>
              <div className="text-xs text-muted-foreground">Viajes Disponibles</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeMatches.length}</div>
              <div className="text-xs text-muted-foreground">Matches Activos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedQuotes.length}</div>
              <div className="text-xs text-muted-foreground">Cotizaciones Rechazadas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
              <div className="text-xs text-muted-foreground">Pagos Pendientes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending" className="relative">
            📦 Solicitudes
            {approvedPackages.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {approvedPackages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trips" className="relative">
            ✈️ Viajes
            {availableTrips.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {availableTrips.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            ❌ Rechazadas
            {rejectedQuotes.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {rejectedQuotes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matches" className="relative">
            🔗 Matches
            {activeMatches.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {activeMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments" className="relative">
            💳 Pagos
            {pendingPayments.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {pendingPayments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <PendingRequestsTab
            packages={packages}
            onOpenMatchDialog={onOpenMatchDialog}
            onViewPackageDetail={onViewPackageDetail}
            onDiscardPackage={onDiscardPackage}
            availableTripsCount={availableTrips.length}
          />
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <AvailableTripsTab
            trips={trips}
            onViewTripDetail={onViewTripDetail}
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cotizaciones Rechazadas por Viajeros</CardTitle>
              <CardDescription>Paquetes que requieren nueva cotización o acción</CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-lg font-medium mb-2">No hay cotizaciones rechazadas</h3>
                  <p className="text-muted-foreground">Todos los viajeros han aceptado sus cotizaciones</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {rejectedQuotes.map(pkg => (
                    <div key={pkg.id} className="border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-lg">{pkg.item_description}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Precio estimado: Q{pkg.estimated_price || 0}</p>
                            <p>Origen: {pkg.purchase_origin} → Destino: {pkg.package_destination}</p>
                            <p>Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</p>
                            {pkg.quote && (
                              <p>Cotización rechazada: Q{pkg.quote.total_price} (Tip: Q{pkg.quote.tip})</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(pkg.status)}
                      </div>
                      
                      <div className="flex gap-2">
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
                          onClick={() => onOpenMatchDialog(pkg)}
                        >
                          Reasignar a otro viajero
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onDiscardPackage(pkg)}
                        >
                          Descartar solicitud
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <ActiveMatchesTab
            packages={packages}
            trips={trips}
            onViewPackageDetail={onViewPackageDetail}
            onConfirmOfficeReception={onConfirmOfficeReception}
            onConfirmDeliveryComplete={onConfirmDeliveryComplete}
            onAdminConfirmOfficeDelivery={onAdminConfirmOfficeDelivery}
            onConfirmShopperReceived={onConfirmShopperReceived}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <PaymentsTab 
            packages={packages}
            onViewPackageDetail={onViewPackageDetail}
            onUpdateStatus={onUpdateStatus}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMatchingTab;
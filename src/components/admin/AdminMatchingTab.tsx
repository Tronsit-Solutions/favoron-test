import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle } from "lucide-react";
import PendingRequestsTab from "./matching/PendingRequestsTab";
import AvailableTripsTab from "./matching/AvailableTripsTab";
import ActiveMatchesTab from "./matching/ActiveMatchesTab";

interface AdminMatchingTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onViewTripDetail: (trip: any) => void;
  onOpenMatchDialog: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: number, status: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminMatchingTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onViewTripDetail, 
  onOpenMatchDialog, 
  onUpdateStatus, 
  getStatusBadge 
}: AdminMatchingTabProps) => {
  const [activeTab, setActiveTab] = useState("pending");

  // Calculate stats
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  const activeMatches = packages.filter(pkg => pkg.matchedTripId);
  const pendingPayments = packages.filter(pkg => pkg.status === 'payment_pending' || pkg.paymentReceipt);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
              <div className="text-xs text-muted-foreground">Pagos Pendientes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            📦 Solicitudes
            {approvedPackages.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {approvedPackages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trips" className="relative">
            ✈️ Viajes
            {availableTrips.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {availableTrips.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matches" className="relative">
            🔗 Matches
            {activeMatches.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {activeMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments" className="relative">
            💳 Pagos
            {pendingPayments.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
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
            availableTripsCount={availableTrips.length}
          />
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <AvailableTripsTab
            trips={trips}
            onViewTripDetail={onViewTripDetail}
          />
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <ActiveMatchesTab
            packages={packages}
            trips={trips}
            onViewPackageDetail={onViewPackageDetail}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>💳 Gestión de pagos</CardTitle>
              <CardDescription>Confirmación de pagos y revisión de comprobantes</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💳</div>
                  <p className="text-muted-foreground">No hay pagos pendientes ni comprobantes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map(pkg => (
                    <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{pkg.itemDescription}</h4>
                              {getStatusBadge(pkg.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                            </p>
                            {pkg.paymentReceipt && (
                              <div className="mt-2 p-2 bg-blue-50 rounded">
                                <p className="text-xs text-blue-800 font-medium">Comprobante de pago:</p>
                                <p className="text-xs text-blue-600">
                                  📄 {pkg.paymentReceipt.filename}
                                </p>
                                <p className="text-xs text-blue-600">
                                  📅 Subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onViewPackageDetail(pkg)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Comprobante
                            </Button>
                            {pkg.status === 'payment_pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirmar Pago
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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

export default AdminMatchingTab;
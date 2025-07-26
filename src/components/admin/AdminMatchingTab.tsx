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
  const pendingPayments = packages.filter(pkg => 
    (pkg.status === 'payment_pending_approval' || pkg.status === 'payment_confirmed') && pkg.payment_receipt
  );

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
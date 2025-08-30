import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import PendingRequestsTab from "./matching/PendingRequestsTab";
import AvailableTripsTab from "./matching/AvailableTripsTab";
import ActiveMatchesTab from "./matching/ActiveMatchesTab";
import PaymentsTab from "./matching/PaymentsTab";
import { supabase } from "@/integrations/supabase/client";

interface AdminMatchingTabProps {
  packages: any[];
  trips: any[];
  modalDataCache?: { selectedPackage: any; matchedTrip: any } | null;
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
  modalDataCache,
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
  const isMobile = useIsMobile();

  // One-time cleanup: expire old quotes server-side when opening matching
  useEffect(() => {
    (async () => {
      try {
        await supabase.rpc('expire_old_quotes');
      } catch {}
    })();
  }, []);

  // Calculate stats
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const rejectedQuotes = packages.filter(p => p.status === 'quote_rejected');
  const pendingRequests = [...approvedPackages, ...rejectedQuotes]; // Combine both types
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  // Active matches exclude expired quotes or expired assignments in real-time
  const activeMatches = packages.filter(pkg => {
    if (!pkg.matched_trip_id) return false;
    const now = Date.now();
    const quoteExpiredByTime = pkg.status === 'quote_sent' && pkg.quote_expires_at && (new Date(pkg.quote_expires_at).getTime() < now);
    const assignmentExpiredByTime = pkg.status === 'matched' && pkg.matched_assignment_expires_at && (new Date(pkg.matched_assignment_expires_at).getTime() < now);
    if (pkg.status === 'quote_expired' || quoteExpiredByTime || assignmentExpiredByTime) return false;
    return true;
  });
  const pendingPayments = packages.filter(pkg => 
    (pkg.status === 'payment_pending_approval' || pkg.status === 'payment_confirmed') && pkg.payment_receipt
  );
  const pendingOfficeConfirmations = packages.filter(pkg => pkg.status === 'pending_office_confirmation');

  // Tabs configuration for mobile
  const tabsConfig = [
    {
      value: "pending",
      label: "📦 Solicitudes",
      badge: pendingRequests.length > 0 ? (
        <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
          {pendingRequests.length}
        </Badge>
      ) : undefined
    },
    {
      value: "trips",
      label: "✈️ Viajes",
      badge: availableTrips.length > 0 ? (
        <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
          {availableTrips.length}
        </Badge>
      ) : undefined
    },
    {
      value: "matches",
      label: "🔗 Matches",
      badge: (
        <>
          {activeMatches.length > 0 && (
            <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
              {activeMatches.length}
            </Badge>
          )}
          {pendingOfficeConfirmations.length > 0 && (
            <NotificationBadge count={pendingOfficeConfirmations.length} className="absolute -top-1 -right-1" />
          )}
        </>
      )
    },
    {
      value: "payments",
      label: "💳 Pagos",
      badge: pendingPayments.length > 0 ? (
        <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
          {pendingPayments.length}
        </Badge>
      ) : undefined
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pendingRequests.length}</div>
              <div className="text-xs text-muted-foreground">Solicitudes Pendientes</div>
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
        {isMobile ? (
          <MobileTabs
            value={activeTab}
            onValueChange={setActiveTab}
            tabs={tabsConfig}
          />
        ) : (
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              📦 Solicitudes
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                  {pendingRequests.length}
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
              {pendingOfficeConfirmations.length > 0 && (
                <NotificationBadge count={pendingOfficeConfirmations.length} className="absolute -top-1 -right-1" />
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
        )}
        <TabsContent value="pending" className="mt-6">
          <PendingRequestsTab
            packages={pendingRequests}
            onOpenMatchDialog={onOpenMatchDialog}
            onViewPackageDetail={onViewPackageDetail}
            onDiscardPackage={onDiscardPackage}
            availableTripsCount={availableTrips.length}
          />
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <AvailableTripsTab
            trips={trips}
            packages={packages}
            onViewTripDetail={onViewTripDetail}
          />
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <ActiveMatchesTab
            packages={packages}
            trips={trips}
            modalDataCache={modalDataCache}
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
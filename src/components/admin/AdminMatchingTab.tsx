import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Badge } from "@/components/ui/badge";

import PendingRequestsTab from "./matching/PendingRequestsTab";
import AvailableTripsTab from "./matching/AvailableTripsTab";
import ActiveMatchesTab from "./matching/ActiveMatchesTab";
import PaymentsTab from "./matching/PaymentsTab";

interface AdminMatchingTabProps {
  packages: any[];
  trips: any[];
  modalDataCache?: { selectedPackage: any; matchedTrip: any } | null;
  activeMatchingTab?: string;
  onMatchingTabChange?: (tab: string) => void;
  onViewPackageDetail: (pkg: any) => void;
  onViewTripDetail: (trip: any) => void;
  onOpenMatchDialog: (pkg: any) => void;
  onDiscardPackage: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onConfirmReception: (packageId: string) => void;
  onConfirmDelivery: (packageId: string) => void;
}

const AdminMatchingTab = ({
  packages,
  trips,
  modalDataCache,
  activeMatchingTab = "pending",
  onMatchingTabChange,
  onViewPackageDetail,
  onViewTripDetail,
  onOpenMatchDialog,
  onDiscardPackage,
  onUpdateStatus,
  onConfirmReception,
  onConfirmDelivery
}: AdminMatchingTabProps) => {
  // Use URL-driven state instead of local state
  const currentTab = activeMatchingTab;
  const setActiveTab = onMatchingTabChange || (() => {});
  
  const isMobile = useIsMobile();

  // One-time server-side cleanup of old quotes
  useEffect(() => {
    const cleanupOldQuotes = async () => {
      try {
        const { error } = await supabase.rpc('expire_old_quotes');
        if (error) {
          console.warn('Error cleaning up old quotes:', error);
        } else {
          console.log('✅ Old quotes cleanup completed');
        }
      } catch (error) {
        console.warn('Error during quote cleanup:', error);
      }
    };
    
    cleanupOldQuotes();
  }, []);

  // Calculate stats
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const rejectedQuotes = packages.filter(p => p.status === 'quote_rejected');
  const pendingRequests = [...approvedPackages, ...rejectedQuotes];
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
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

      <Tabs value={currentTab} onValueChange={setActiveTab}>
        {isMobile ? (
          <MobileTabs
            value={currentTab}
            onValueChange={setActiveTab}
            tabs={tabsConfig}
          />
        ) : (
          <TabsList className="grid w-full grid-cols-4">
            {tabsConfig.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative flex items-center gap-2"
              >
                {tab.label}
                {tab.badge}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value="pending" className="space-y-4">
          <PendingRequestsTab
            packages={pendingRequests}
            onViewPackageDetail={onViewPackageDetail}
            onOpenMatchDialog={onOpenMatchDialog}
            onDiscardPackage={onDiscardPackage}
            availableTripsCount={availableTrips.length}
          />
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <AvailableTripsTab
            trips={trips}
            packages={packages}
            onViewTripDetail={onViewTripDetail}
          />
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <ActiveMatchesTab
            packages={packages}
            trips={trips}
            modalDataCache={modalDataCache}
            onViewPackageDetail={onViewPackageDetail}
            onConfirmOfficeReception={onConfirmReception}
            onConfirmDeliveryComplete={onConfirmDelivery}
            onAdminConfirmOfficeDelivery={onAdminConfirmOfficeDelivery || (() => {})}
            onConfirmShopperReceived={onConfirmShopperReceived || (() => {})}
            getStatusBadge={getStatusBadge || (() => <span>Status</span>)}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsTab 
            packages={packages}
            onViewPackageDetail={onViewPackageDetail}
            onUpdateStatus={onUpdateStatus}
            getStatusBadge={getStatusBadge || (() => <span>Status</span>)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMatchingTab;
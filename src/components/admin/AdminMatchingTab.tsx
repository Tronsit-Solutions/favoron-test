import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Badge } from "@/components/ui/badge";
import { usePackageMessageCounts } from '@/hooks/usePackageMessageCounts';

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
  onRejectPackage: (pkgId: string, reason: string) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onConfirmReception: (packageId: string) => void;
  onConfirmDelivery: (packageId: string) => void;
  onAdminConfirmOfficeDelivery?: (packageId: string) => void;
  onConfirmShopperReceived?: (packageId: string) => void;
  onOpenActionsModal?: (packageId: string) => void;
  getStatusBadge?: (status: string) => JSX.Element;
  unreadCounts?: { [packageId: string]: number };
  markPackageMessagesAsRead?: (packageId: string) => Promise<void>;
  // Pagination props
  loadMorePackages?: () => Promise<void>;
  hasMorePackages?: boolean;
  totalPackages?: number;
  autoApprovedPayments?: any[];
  approvedPaymentsData?: any[];
  autoApprovedPaymentsLoading?: boolean;
  approvedPaymentsLoading?: boolean;
  loadAutoApprovedPayments?: () => Promise<void>;
  loadApprovedPayments?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
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
  onRejectPackage,
  onUpdateStatus,
  onConfirmReception,
  onConfirmDelivery,
  onAdminConfirmOfficeDelivery,
  onConfirmShopperReceived,
  onOpenActionsModal,
  getStatusBadge,
  unreadCounts = {},
  markPackageMessagesAsRead,
  loadMorePackages,
  hasMorePackages = false,
  totalPackages = 0,
  autoApprovedPayments = [],
  approvedPaymentsData = [],
  autoApprovedPaymentsLoading = false,
  approvedPaymentsLoading = false,
  loadAutoApprovedPayments,
  loadApprovedPayments,
  onRefresh
}: AdminMatchingTabProps) => {
  // Use URL-driven state instead of local state
  const currentTab = activeMatchingTab;
  const setActiveTab = onMatchingTabChange || (() => {});
  
  const isMobile = useIsMobile();
  const { hasMessages } = usePackageMessageCounts();

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

  // Fetch package_assignments for multi-assigned packages
  const [assignmentsMap, setAssignmentsMap] = useState<{ [packageId: string]: { count: number; assignments: any[] } }>({});
  
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data, error } = await supabase
          .from('package_assignments')
          .select('id, package_id, trip_id, status, quote, admin_assigned_tip, traveler_address, matched_trip_dates, products_data')
          .not('status', 'eq', 'rejected');

        if (error) throw error;
        if (data) {
          const map: { [packageId: string]: { count: number; assignments: any[] } } = {};
          data.forEach(assignment => {
            if (!map[assignment.package_id]) {
              map[assignment.package_id] = { count: 0, assignments: [] };
            }
            map[assignment.package_id].count++;
            map[assignment.package_id].assignments.push(assignment);
          });
          setAssignmentsMap(map);
        }
      } catch (err) {
        console.warn('Error fetching package assignments:', err);
      }
    };
    fetchAssignments();
  }, [packages]);

  // Multi-assigned package IDs (packages with assignments but no matched_trip_id)
  const multiAssignedPackageIds = useMemo(() => {
    const ids = new Set<string>();
    packages.forEach(pkg => {
      if (!pkg.matched_trip_id && assignmentsMap[pkg.id] && assignmentsMap[pkg.id].count > 0) {
        ids.add(pkg.id);
      }
    });
    return ids;
  }, [packages, assignmentsMap]);

  // Calculate stats
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const rejectedQuotes = packages.filter(p => p.status === 'quote_rejected');
  const pendingRequests = [...approvedPackages, ...rejectedQuotes].filter(p => !multiAssignedPackageIds.has(p.id));
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  const activeMatches = packages.filter(pkg => {
    return (pkg.matched_trip_id !== null && pkg.matched_trip_id !== undefined) || multiAssignedPackageIds.has(pkg.id);
  });
  const pendingPayments = packages.filter(pkg => 
    pkg.status === 'payment_pending_approval' && pkg.payment_receipt
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
            onRejectPackage={onRejectPackage}
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
            onOpenActionsModal={onOpenActionsModal}
            getStatusBadge={getStatusBadge || ((status: string) => <span>{status}</span>)}
            unreadCounts={unreadCounts}
            markPackageMessagesAsRead={markPackageMessagesAsRead}
            hasMessages={hasMessages}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsTab 
            packages={packages}
            onViewPackageDetail={onViewPackageDetail}
            onUpdateStatus={onUpdateStatus}
            getStatusBadge={getStatusBadge || ((status: string) => <span>{status}</span>)}
            autoApprovedPayments={autoApprovedPayments}
            approvedPaymentsData={approvedPaymentsData}
            autoApprovedPaymentsLoading={autoApprovedPaymentsLoading}
            approvedPaymentsLoading={approvedPaymentsLoading}
            loadAutoApprovedPayments={loadAutoApprovedPayments}
            loadApprovedPayments={loadApprovedPayments}
            onRefresh={onRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMatchingTab;
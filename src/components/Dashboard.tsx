import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PackageRequestForm from "./PackageRequestForm";
import TripForm from "./TripForm";
import AddressConfirmationModal from "./AddressConfirmationModal";
import AdminDashboard from "./AdminDashboard";
import QuoteDialog from "./QuoteDialog";
import UserProfile from "./UserProfile";
import DashboardHeader from "./dashboard/DashboardHeader";
import QuickActions from "./dashboard/QuickActions";
import RecentActivity from "./dashboard/RecentActivity";
import CollapsiblePackageCard from "./dashboard/CollapsiblePackageCard";
import TripCard from "./dashboard/TripCard";
import TripPackagesGroup from "./dashboard/TripPackagesGroup";
import TravelerTipsOverview from "./dashboard/TravelerTipsOverview";
import EmptyState from "./dashboard/EmptyState";
import AvailableTripsCard from "./AvailableTripsCard";
import AvailableTripsModal from "./AvailableTripsModal";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { usePendingActions } from "@/hooks/usePendingActions";
import { useOptimizedRealtime } from "@/hooks/useOptimizedRealtime";
import { useTabAwareData } from "@/hooks/useTabAwareData";

import UserManagement from "./admin/UserManagement";

import { NotificationBadge } from "@/components/ui/notification-badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { supabase } from "@/integrations/supabase/client";

interface DashboardProps {
  user: any;
}

const Dashboard = ({ user }: DashboardProps) => {
  const { signOut, profile, userRole } = useAuth();
  const [showAvailableTripsModal, setShowAvailableTripsModal] = useState(false);
  
  const {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    showPackageForm,
    setShowPackageForm,
    showTripForm,
    setShowTripForm,
    packagesLoading,
    tripsLoading,
    showAddressConfirmation,
    setShowAddressConfirmation,
    showQuoteDialog,
    setShowQuoteDialog,
    showProfile,
    setShowProfile,
    showUserManagement,
    setShowUserManagement,
    selectedPackageForAddress,
    setSelectedPackageForAddress,
    selectedPackageForQuote,
    setSelectedPackageForQuote,
    quoteUserType,
    setQuoteUserType,
    packages,
    trips,
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages,
    createTrip,
    updateTrip,
    refreshTrips,
    setPackages
  } = useDashboardState({
    ...(profile || user),
    role: userRole?.role || 'user'
  });


  const {
    handlePackageSubmit,
    handleTripSubmit,
    handleAddressConfirmation,
    handleQuoteSubmit,
    handleQuote,
    handleConfirmAddress,
    handleUploadDocument,
    handleConfirmPayment,
    handleMatchPackage,
    handleStatusUpdate,
    handleApproveReject,
    handlePaymentApproval,
    handleConfirmPackageReceived,
    handleConfirmOfficeReception,
    handleConfirmDeliveryComplete,
    handleEditTrip,
    handleEditPackage,
    handleAdminConfirmOfficeDelivery,
    handleConfirmShopperReceived
  } = useDashboardActions(
    packages,
    () => {},
    trips,
    () => {},
    currentUser,
    setShowPackageForm,
    setShowTripForm,
    setShowAddressConfirmation,
    setSelectedPackageForAddress,
    setShowQuoteDialog,
    setSelectedPackageForQuote,
    setQuoteUserType,
    createPackage,
    createTrip,
    updatePackage,
    updateTrip,
    setActiveTab, // Add setActiveTab here
    async () => { await refreshPackages(); }, // Add refreshPackages function wrapped
    async () => { await refreshTrips(); } // Add refreshTrips function wrapped
  );

  const pendingActions = usePendingActions(packages, trips, currentUser);


  const isAdmin = currentUser.role === 'admin';
  
  // Filter packages and trips for current user
  const userPackages = packages.filter(pkg => pkg.user_id === currentUser.id);
  const userTrips = trips.filter(trip => trip.user_id === currentUser.id);
  
  // Get packages assigned to user's trips (for traveler view)
  const assignedPackages = packages.filter(pkg => 
    userTrips.some(trip => trip.id === pkg.matched_trip_id)
  );

  // Tab awareness for intelligent refreshing
  useTabAwareData({
    onTabActive: () => {
      // Only refresh if data is older than 2 minutes
      const shouldRefresh = Date.now() - (packages[0]?.updated_at ? new Date(packages[0].updated_at).getTime() : 0) > 120000;
      if (shouldRefresh) {
        refreshPackages();
      }
    },
    refreshOnReturn: true,
    refreshThreshold: 120000 // 2 minutes
  });

  // Optimized real-time updates with minimal refetching
  useOptimizedRealtime({
    onPackageUpdate: (updatedPackages) => {
      // Use optimistic updates instead of full refresh
      if (updatedPackages.length > 0) {
        setPackages(updatedPackages);
      }
    },
    onTripUpdate: () => {
      // Only refresh trips data, not packages
      refreshTrips();
    },
    userRole: isAdmin ? 'admin' : (assignedPackages.length > 0 ? 'traveler' : 'shopper'),
    packages
  });

  const handleUpdateUser = async (userData: any) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: userData.firstName || userData.first_name,
          last_name: userData.lastName || userData.last_name,
          username: userData.username,
          phone_number: userData.phone || userData.phone_number,
          avatar_url: userData.avatarUrl || userData.avatar_url,
          bank_account_holder: userData.bank_account_holder || userData.bankAccountHolder,
          bank_name: userData.bank_name || userData.bankName,
          bank_account_type: userData.bank_account_type || userData.bankAccountType,
          bank_account_number: userData.bank_account_number || userData.bankAccountNumber
        })
        .eq('id', currentUser.id);

      if (error) {
        return;
      }

      // Update local state
      setCurrentUser(userData);
    } catch (error) {
      // Error silently handled
    }
  };

  const { getStatusBadge } = useStatusHelpers();


  if (showProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setShowProfile(false)}
          onLogout={signOut}
          onShowUserManagement={() => setShowUserManagement(true)}
          onGoHome={() => setShowProfile(false)}
          onRefresh={() => {
            refreshPackages();
            refreshTrips();
          }}
          isRefreshing={packagesLoading || tripsLoading}
        />
        <div className="container mx-auto px-4 py-8">
          <UserProfile 
            user={currentUser} 
            packages={packages}
            trips={trips}
            onUpdateUser={handleUpdateUser} 
          />
        </div>
      </div>
    );
  }

  if (showUserManagement) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setShowProfile(true)}
          onLogout={signOut}
          onShowUserManagement={() => setShowUserManagement(false)}
          onGoHome={() => setShowUserManagement(false)}
          onRefresh={() => {
            refreshPackages();
            refreshTrips();
          }}
          isRefreshing={packagesLoading || tripsLoading}
        />
        <div className="container mx-auto px-4 py-8">
          <UserManagement 
            packages={packages}
            trips={trips}
          />
        </div>
      </div>
    );
  }

  // Enhanced handleStatusUpdate to include payment confirmation
  const enhancedHandleStatusUpdate = (type: 'package' | 'trip', id: string, status: string) => {
    if (status === 'payment_confirmed') {
      handleConfirmPayment(id);
    } else {
      handleStatusUpdate(type, id, status);
    }
  };

  const handleDiscardPackage = async (pkg: any) => {
    try {
      await deletePackage(pkg.id);
    } catch (error) {
      // Error silently handled
    }
  };

  const handleArchivePackage = async (pkg: any) => {
    try {
      await updatePackage(pkg.id, { status: 'archived_by_shopper' });
    } catch (error) {
      // Error silently handled
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        user={currentUser}
        onShowProfile={() => setShowProfile(true)}
        onLogout={signOut}
        onShowUserManagement={() => setShowUserManagement(true)}
        onRefresh={() => {
          refreshPackages();
          refreshTrips();
        }}
        isRefreshing={packagesLoading || tripsLoading}
      />

      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-full overflow-hidden">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            ¡Hola, {currentUser?.name || currentUser?.firstName || currentUser?.first_name || 'Usuario'}! 👋
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestiona tus solicitudes de paquetes y viajes desde aquí
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full text-xs sm:text-sm ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview">Home</TabsTrigger>
            <TabsTrigger value="packages" className="relative flex items-center gap-2">
              Mis Pedidos
              {pendingActions.shopperTotal > 0 && (
                <NotificationBadge count={pendingActions.shopperTotal} />
              )}
            </TabsTrigger>
            <TabsTrigger value="trips" className="relative flex items-center gap-2">
              Mis Viajes
              {pendingActions.travelerTotal > 0 && (
                <NotificationBadge count={pendingActions.travelerTotal} />
              )}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="relative flex items-center gap-2">
                Admin
                {pendingActions.adminTotal > 0 && (
                  <NotificationBadge count={pendingActions.adminTotal} />
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <QuickActions 
              onShowPackageForm={() => setShowPackageForm(true)}
              onShowTripForm={() => setShowTripForm(true)}
            />
            <AvailableTripsCard 
              onViewTrips={() => setShowAvailableTripsModal(true)}
            />
            <RecentActivity 
              packages={packages}
              trips={trips}
              getStatusBadge={getStatusBadge}
              currentUserId={user?.id}
            />
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Mis Solicitudes de Paquetes</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Gestiona tus pedidos como <strong>shopper</strong> - aquí recibes cotizaciones de viajeros
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="shopper" onClick={() => setShowPackageForm(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nueva Solicitud</span>
                  <span className="sm:hidden">Nuevo Pedido</span>
                </Button>
              </div>
            </div>

            {userPackages.filter(pkg => {
              // Excluir paquetes cancelados, completados y archivados por el shopper
              if (pkg.status === 'cancelled' || pkg.status === 'completed' || pkg.status === 'archived_by_shopper') return false;
              
              // Excluir paquetes que pertenecen a viajes completados y pagados
              if (pkg.matched_trip_id) {
                const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
                if (matchedTrip && matchedTrip.status === 'completed_paid') return false;
              }
              return true;
            }).length === 0 ? (
              <EmptyState type="packages" onAction={() => setShowPackageForm(true)} />
            ) : (
              <div className="grid gap-6">
                 {userPackages.filter(pkg => {
                   // Excluir paquetes cancelados, completados y archivados por el shopper
                   if (pkg.status === 'cancelled' || pkg.status === 'completed' || pkg.status === 'archived_by_shopper') return false;
                   
                   // Excluir paquetes que pertenecen a viajes completados y pagados
                   if (pkg.matched_trip_id) {
                     const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
                     if (matchedTrip && matchedTrip.status === 'completed_paid') return false;
                   }
                   return true;
                 })
                 .sort((a, b) => {
                   // Ordenar: completados/entregados al final
                   const completedStatuses = ['delivered', 'completed'];
                   const aCompleted = completedStatuses.includes(a.status);
                   const bCompleted = completedStatuses.includes(b.status);
                   
                   if (aCompleted && !bCompleted) return 1;
                   if (!aCompleted && bCompleted) return -1;
                   
                   // Si ambos son completados o ambos no son completados, ordenar por fecha de creación (más recientes primero)
                   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                 })
                 .map((pkg) => (
                     <CollapsiblePackageCard
                       key={pkg.id}
                       pkg={pkg}
                        onQuote={(pkg, userType) => {
                          setSelectedPackageForQuote(pkg);
                          setQuoteUserType(userType);
                          setShowQuoteDialog(true);
                        }}
                       onConfirmAddress={handleAddressConfirmation}
                       onUploadDocument={handleUploadDocument}
                       onEditPackage={(editedPkg) => updatePackage(editedPkg.id, editedPkg)}
                       onDeletePackage={(p) => deletePackage(p.id)}
                       onArchivePackage={handleArchivePackage}
                       onRequestRequote={async (p) => {
                         await updatePackage(p.id, {
                           status: 'approved',
                           matched_trip_id: null,
                           quote: null,
                           quote_expires_at: null,
                           wants_requote: true,
                         } as any);
                       }}
                       viewMode="user"
                     />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Mis Viajes</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Gestiona tus viajes como <strong>viajero</strong> - envía cotizaciones y ve paquetes asignados
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="traveler" onClick={() => setShowTripForm(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Viaje
                </Button>
              </div>
            </div>

            {/* Show user's trips */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-3">Mis Viajes Registrados</h4>
                {userTrips.filter(trip => trip.status !== 'completed_paid').length === 0 ? (
                  <EmptyState type="trips" onAction={() => setShowTripForm(true)} />
                ) : (
                  <div className="grid gap-4">
                    {userTrips.filter(trip => trip.status !== 'completed_paid').map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        getStatusBadge={(status) => getStatusBadge(status, { context: 'trip' })}
                        onEditTrip={handleEditTrip}
                        currentUser={currentUser}
                        travelerProfile={currentUser} // Pasar el perfil actual como travelerProfile
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Show packages assigned to user's trips - NOW GROUPED BY TRIP */}
              {assignedPackages.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Paquetes Asignados a Mis Viajes</h4>
                   
                  {/* Tips Overview with trip filter */}
                  <TravelerTipsOverview packages={assignedPackages} trips={userTrips} />
                  
                  {/* Group packages by trip */}
                   <div className="space-y-6">
                     {userTrips
                        .filter(trip => trip.status !== 'completed_paid' && assignedPackages.some(pkg => pkg.matched_trip_id === trip.id))
                        .map((trip) => {
                         const tripPackages = assignedPackages.filter(pkg => pkg.matched_trip_id === trip.id);
                        const hasPendingActions = tripPackages.some(pkg => ['matched', 'in_transit', 'pending_office_confirmation'].includes(pkg.status));
                        
                        return (
                          <TripPackagesGroup
                            key={trip.id}
                            trip={trip}
                            packages={tripPackages}
                            getStatusBadge={getStatusBadge}
                            onQuote={handleQuote}
                            onConfirmReceived={handleConfirmPackageReceived}
                            onConfirmOfficeDelivery={(packageId) => {
                              // Solo actualizar status, sin modal bancario (se acumula automáticamente via trigger)
                              handleConfirmOfficeReception(packageId);
                            }}
                            defaultExpanded={hasPendingActions}
                          />
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard 
              packages={packages}
              trips={trips}
              currentUser={currentUser}
              onMatchPackage={handleMatchPackage}
              onUpdateStatus={enhancedHandleStatusUpdate}
              onApproveReject={handleApproveReject}
              onPaymentApproval={handlePaymentApproval}
               onConfirmOfficeReception={(packageId) => {
                 // Solo actualizar status, sin modal bancario (se acumula automáticamente via trigger)
                 handleConfirmOfficeReception(packageId);
               }}
              onConfirmDeliveryComplete={handleConfirmDeliveryComplete}
              onDiscardPackage={handleDiscardPackage}
              onAdminConfirmOfficeDelivery={handleAdminConfirmOfficeDelivery}
              onConfirmShopperReceived={handleConfirmShopperReceived}
              onRefreshPackages={refreshPackages}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modals */}
      <PackageRequestForm
        isOpen={showPackageForm}
        onClose={() => setShowPackageForm(false)}
        onSubmit={handlePackageSubmit}
      />

      <TripForm
        isOpen={showTripForm}
        onClose={() => setShowTripForm(false)}
        onSubmit={handleTripSubmit}
      />

      {selectedPackageForAddress && (
        <AddressConfirmationModal
          isOpen={showAddressConfirmation}
          onClose={() => {
            setShowAddressConfirmation(false);
            setSelectedPackageForAddress(null);
          }}
          onConfirm={handleAddressConfirmation}
          currentAddress={
            (selectedPackageForAddress.confirmed_delivery_address as any) ||
            (selectedPackageForAddress.traveler_address as any) ||
            { streetAddress: '', cityArea: '', contactNumber: '' }
          }
          packageDetails={{
            itemDescription: selectedPackageForAddress.item_description,
            estimatedPrice: String(selectedPackageForAddress.estimated_price ?? '')
          }}
        />
      )}

      {selectedPackageForQuote && (
        <QuoteDialog
          isOpen={showQuoteDialog}
          onClose={() => {
            setShowQuoteDialog(false);
            setSelectedPackageForQuote(null);
          }}
          onSubmit={(quoteData) => handleQuoteSubmit(quoteData, selectedPackageForQuote, quoteUserType)}
          packageDetails={{
            item_description: selectedPackageForQuote.item_description,
            estimated_price: Number(selectedPackageForQuote.estimated_price || 0),
            item_link: selectedPackageForQuote.item_link || undefined,
            deliveryAddress: (selectedPackageForQuote.confirmed_delivery_address as any) || undefined,
            delivery_method: selectedPackageForQuote.delivery_method || undefined,
            products_data: Array.isArray(selectedPackageForQuote.products_data)
              ? (selectedPackageForQuote.products_data as any[])
              : undefined,
            admin_assigned_tip:
              selectedPackageForQuote.admin_assigned_tip != null
                ? String(selectedPackageForQuote.admin_assigned_tip)
                : undefined,
            status: selectedPackageForQuote.status,
            traveler_address: selectedPackageForQuote.traveler_address || undefined,
          }}
          userType={quoteUserType}
          existingQuote={selectedPackageForQuote.quote as any}
          tripDates={(selectedPackageForQuote.matched_trip_dates as any) as {
            first_day_packages: string;
            last_day_packages: string;
            delivery_date: string;
            arrival_date: string;
          }}
        />
      )}

      <AvailableTripsModal
        isOpen={showAvailableTripsModal}
        onClose={() => setShowAvailableTripsModal(false)}
      />

    </div>
  );
};

export default Dashboard;

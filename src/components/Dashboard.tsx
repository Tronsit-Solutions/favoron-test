import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PackageRequestForm from "./PackageRequestForm";
import TripForm from "./TripForm";
import AddressConfirmationModal from "./AddressConfirmationModal";
import AdminDashboard from "./AdminDashboard";
import QuoteDialog from "./QuoteDialog";
import UserProfile from "./UserProfile";
import EditProfileModal from "./profile/EditProfileModal";
import DashboardHeader from "./dashboard/DashboardHeader";
import QuickActions from "./dashboard/QuickActions";
import RecentActivity from "./dashboard/RecentActivity";
import { PhoneNumberBanner } from "./PhoneNumberBanner";
import { usePhoneNumberValidation } from "@/hooks/usePhoneNumberValidation";
import CollapsiblePackageCard from "./dashboard/CollapsiblePackageCard";
import TripCard from "./dashboard/TripCard";
import TripPackagesGroup from "./dashboard/TripPackagesGroup";

import EmptyState from "./dashboard/EmptyState";
import ProtectedEmptyState from "./dashboard/ProtectedEmptyState";

import AvailableTripsCard from "./AvailableTripsCard";
import AvailableTripsModal from "./AvailableTripsModal";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { useUrlState } from "@/hooks/useUrlState";
import { useProtectedNavigation } from "@/hooks/useProtectedNavigation";
import { Routes, Route } from "react-router-dom";
import { usePendingActions } from "@/hooks/usePendingActions";
import { useOptimizedRealtime } from "@/hooks/useOptimizedRealtime";
import { useStickyState } from "@/hooks/useStickyState";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";



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
  const { isPhoneNumberMissing } = usePhoneNumberValidation();
  
  // Use protected navigation that checks profile completion
  const { navigateToFormWithProfileCheck, isProfileComplete } = useProtectedNavigation();
  
  // Fallback navigation functions
  let navigateToForm: (formType: 'package' | 'trip') => void;
  let navigateBack: () => void;
  
  try {
    const urlState = useUrlState();
    navigateBack = urlState.navigateBack;
  } catch {
    // Fallback if useUrlState fails (not in proper router context)
    navigateBack = () => {
      setShowPackageForm(false);
      setShowTripForm(false);
    };
  }

  // Simple navigation function (no longer blocking on profile completion)
  navigateToForm = (formType: 'package' | 'trip') => {
    navigateToFormWithProfileCheck(formType);
  };
  
  const [showAvailableTripsModal, setShowAvailableTripsModal] = useState(false);
  
  const {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    matchingTab,
    setMatchingTab,
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
    setPackages,
    toast,
    unreadCounts,
    markPackageMessagesAsRead
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
    setPackages,
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

  // Filter preference for inactive trips
  const {
    state: hideInactiveTrips,
    setState: setHideInactiveTrips
  } = useStickyState({
    key: 'dashboard-hide-inactive-trips',
    initialState: true
  });

  // Real-time updates are now active, no manual refresh needed

  const isAdmin = currentUser.role === 'admin';
  
  // Filter packages and trips for current user
  const userPackages = packages.filter(pkg => pkg.user_id === currentUser.id);
  const userTrips = trips.filter(trip => trip.user_id === currentUser.id);
  
  // Filter user trips based on inactive preference
  const filteredUserTrips = userTrips.filter(trip => {
    // Filter out inactive trips if user preference is enabled
    const inactiveStatuses = ['completed', 'rejected', 'cancelled', 'completed_paid'];
    const isActive = !inactiveStatuses.includes(trip.status);
    const shouldShow = !hideInactiveTrips || isActive;
    
    return shouldShow;
  });
  
  // Get packages assigned to user's trips (for traveler view)
  const assignedPackages = packages.filter(pkg => 
    userTrips.some(trip => trip.id === pkg.matched_trip_id)
  );

  // Real-time updates with modal protection enabled
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

  // Phone number banner component
  const PhoneNumberBannerSection = () => {
    if (!isPhoneNumberMissing) return null;

    const handleCompleteProfile = () => {
      setShowProfile(true);
    };

    return (
      <>
        <PhoneNumberBanner onOpenProfileModal={handleCompleteProfile} />
      </>
    );
  };



  if (showUserManagement) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setShowProfile(true)}
          onLogout={signOut}
          onShowUserManagement={() => setShowUserManagement(false)}
          onGoHome={() => setShowUserManagement(false)}
        />
        <div className="container mx-auto mobile-container py-8">
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
      console.log('📦 Cancelling package:', pkg.id);
      await updatePackage(pkg.id, { status: 'cancelled' });
      toast({
        title: "Solicitud cancelada",
        description: "La solicitud ha sido marcada como cancelada exitosamente.",
      });
      await refreshPackages();
    } catch (error) {
      console.error('Error cancelling package:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleArchivePackage = async (pkg: any) => {
    try {
      // Placeholder - AdminDashboard handles package operations
      console.log('📦 Archive package request - handled by AdminDashboard');
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
      />

      <div className="container mx-auto mobile-container py-4 sm:py-6 lg:py-8 max-w-full overflow-hidden">
        <PhoneNumberBannerSection />
        
        
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
              onShowPackageForm={() => navigateToForm('package')}
              onShowTripForm={() => navigateToForm('trip')}
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
                <Button variant="shopper" className="w-full sm:w-auto" onClick={() => navigateToForm('package')}>
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
              <ProtectedEmptyState type="packages" onAction={() => navigateToForm('package')} />
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
                        onEditPackage={handleEditPackage}
                        onDeletePackage={() => console.log('Delete package - handled by AdminDashboard')}
                       onArchivePackage={handleArchivePackage}
                        onRequestRequote={() => console.log('Request requote - handled by AdminDashboard')}
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
                <Button variant="traveler" className="w-full sm:w-auto" onClick={() => navigateToForm('trip')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Viaje
                </Button>
              </div>
            </div>

            {/* Show user's trips */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold">Mis Viajes Registrados</h4>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Switch
                      id="hide-inactive-trips"
                      checked={hideInactiveTrips}
                      onCheckedChange={setHideInactiveTrips}
                      className="scale-90 sm:scale-100"
                    />
                    <Label htmlFor="hide-inactive-trips" className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      <span className="hidden sm:inline">Ocultar viajes completados/rechazados</span>
                      <span className="sm:hidden">Ocultar completados</span>
                    </Label>
                  </div>
                </div>
                {filteredUserTrips.length === 0 ? (
                  <ProtectedEmptyState type="trips" onAction={() => navigateToForm('trip')} />
                ) : (
                  <div className="grid gap-4">
                    {filteredUserTrips.map((trip) => (
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
                   
                   {/* Group packages by trip */}
                   <div className="space-y-6">
                     {filteredUserTrips
                        .filter(trip => assignedPackages.some(pkg => pkg.matched_trip_id === trip.id))
                        .map((trip) => {
                          const tripPackages = assignedPackages.filter(pkg => pkg.matched_trip_id === trip.id);
                          const now = Date.now();
                          const PAID_OR_POST_PAYMENT = [
                            'pending_purchase',
                            'payment_pending_approval',
                            'paid',
                            'purchased',
                            'shipped',
                            'in_transit',
                            'received_by_traveler',
                            'delivered_to_office',
                            'completed'
                          ];
                          const isTimerActive = (pkg: any) => (
                            (pkg.status === 'matched' && pkg.matched_assignment_expires_at && new Date(pkg.matched_assignment_expires_at).getTime() > now) ||
                            ((pkg.status === 'quote_sent' || pkg.status === 'payment_pending') && pkg.quote_expires_at && new Date(pkg.quote_expires_at).getTime() > now)
                          );
                          const isPaidOrPostPayment = (status: string) => PAID_OR_POST_PAYMENT.includes(status);
                          const filteredTripPackages = tripPackages.filter(pkg => isTimerActive(pkg) || isPaidOrPostPayment(pkg.status));
                          const hasPendingActions = filteredTripPackages.some(pkg => ['matched', 'in_transit', 'pending_office_confirmation'].includes(pkg.status));
                          
                          if (filteredTripPackages.length === 0) return null;
                          
                          return (
                            <TripPackagesGroup
                              key={trip.id}
                              trip={trip}
                              packages={filteredTripPackages}
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
              matchingTab={matchingTab}
              onMatchingTabChange={setMatchingTab}
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
              refreshAdminData={async () => { await refreshPackages(); }}
              unreadCounts={unreadCounts}
              markPackageMessagesAsRead={markPackageMessagesAsRead}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* URL-based routing for forms */}
      <Routes>
        <Route 
          path="/package" 
          element={
            <PackageRequestForm
              isOpen={true}
              onClose={navigateBack}
              onSubmit={handlePackageSubmit}
            />
          } 
        />
        <Route 
          path="/trip" 
          element={
            <TripForm
              isOpen={true}
              onClose={navigateBack}
              onSubmit={handleTripSubmit}
            />
          } 
        />
      </Routes>

      {/* Legacy modals for backward compatibility */}
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

      <EditProfileModal
        user={currentUser}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onUpdateUser={handleUpdateUser}
      />

    </div>
  );
};

export default Dashboard;

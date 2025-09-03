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
import ProfileCompletionIndicator from "./ProfileCompletionIndicator";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import CollapsiblePackageCard from "./dashboard/CollapsiblePackageCard";
import TripCard from "./dashboard/TripCard";
import TripPackagesGroup from "./dashboard/TripPackagesGroup";
import TravelerTipsOverview from "./dashboard/TravelerTipsOverview";
import EmptyState from "./dashboard/EmptyState";
import ProtectedEmptyState from "./dashboard/ProtectedEmptyState";
import ProfileCompletionGuard from "./ProfileCompletionGuard";
import AvailableTripsCard from "./AvailableTripsCard";
import AvailableTripsModal from "./AvailableTripsModal";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { useUrlState } from "@/hooks/useUrlState";
import { Routes, Route } from "react-router-dom";
import { usePendingActions } from "@/hooks/usePendingActions";
import { useOptimizedRealtime } from "@/hooks/useOptimizedRealtime";



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
  
  // Only use URL state in the dashboard context, fallback to regular functions if not available
  let navigateToForm: (formType: 'package' | 'trip') => void;
  let navigateBack: () => void;
  
  try {
    const urlState = useUrlState();
    navigateToForm = urlState.navigateToForm;
    navigateBack = urlState.navigateBack;
  } catch {
    // Fallback if useUrlState fails (not in proper router context)
    // This fallback should NOT bypass ProfileCompletionGuard - it will be handled by the guard wrapper
    navigateToForm = (formType: 'package' | 'trip') => {
      if (formType === 'package') {
        setShowPackageForm(true);
      } else {
        setShowTripForm(true);
      }
    };
    navigateBack = () => {
      setShowPackageForm(false);
      setShowTripForm(false);
    };
  }
  
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

  // Real-time updates are now active, no manual refresh needed

  const isAdmin = currentUser.role === 'admin';
  
  // Filter packages and trips for current user
  const userPackages = packages.filter(pkg => pkg.user_id === currentUser.id);
  const userTrips = trips.filter(trip => trip.user_id === currentUser.id);
  
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

  // Profile completion section component
  const ProfileCompletionSection = () => {
    const { isComplete } = useProfileCompletion();

    if (isComplete) return null;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <ProfileCompletionIndicator showDetails={true} />
      </div>
    );
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setShowProfile(false)}
          onLogout={signOut}
          onShowUserManagement={() => setShowUserManagement(true)}
          onGoHome={() => setShowProfile(false)}
        />
        <div className="container mx-auto mobile-container py-8">
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
      // Placeholder - AdminDashboard handles package operations
      console.log('📦 Delete package request - handled by AdminDashboard');
    } catch (error) {
      // Error silently handled
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
        <ProfileCompletionSection />
        
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
                <ProfileCompletionGuard
                  onAction={() => navigateToForm('package')}
                  title="Completar perfil para solicitar paquetes"
                  description="Necesitamos tu información de contacto para procesar tu solicitud de paquete."
                >
                  <Button variant="shopper" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Nueva Solicitud</span>
                    <span className="sm:hidden">Nuevo Pedido</span>
                  </Button>
                </ProfileCompletionGuard>
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
                <ProfileCompletionGuard
                  onAction={() => navigateToForm('trip')}
                  title="Completar perfil para registrar viajes"
                  description="Necesitamos tu información de contacto para procesar tu registro de viaje."
                >
                  <Button variant="traveler" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Viaje
                  </Button>
                </ProfileCompletionGuard>
              </div>
            </div>

            {/* Show user's trips */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-3">Mis Viajes Registrados</h4>
                {userTrips.filter(trip => trip.status !== 'completed_paid').length === 0 ? (
                  <ProtectedEmptyState type="trips" onAction={() => navigateToForm('trip')} />
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

    </div>
  );
};

export default Dashboard;

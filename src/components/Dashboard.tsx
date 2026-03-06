import { useState, useEffect } from "react";

import { Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PackageRequestForm from "./PackageRequestForm";
import TripForm from "./TripForm";
import AddressConfirmationModal from "./AddressConfirmationModal";
import AdminDashboard from "./AdminDashboard";

import QuoteDialog from "./QuoteDialog";
import UserProfile from "./UserProfile";
import EditProfileModal from "./profile/EditProfileModal";
import DashboardHeader from "./dashboard/DashboardHeader";
import QuickActions from "./dashboard/QuickActions";

import { PhoneNumberBanner } from "./PhoneNumberBanner";
import PrimeModal from "./PrimeModal";
import ProfileCompletionModal from "./ProfileCompletionModal";
import { usePhoneNumberValidation } from "@/hooks/usePhoneNumberValidation";
import CollapsiblePackageCard from "./dashboard/CollapsiblePackageCard";
import TripCard from "./dashboard/TripCard";
import TripPackagesGroup from "./dashboard/TripPackagesGroup";
import CollapsibleTravelerPackageCard from "./dashboard/CollapsibleTravelerPackageCard";

import EmptyState from "./dashboard/EmptyState";
import ProtectedEmptyState from "./dashboard/ProtectedEmptyState";
import { TripSelector } from "./dashboard/TripSelector";

import AvailableTripsCard from "./AvailableTripsCard";
import ReferralBanner from "./dashboard/ReferralBanner";
import AvailableTripsModal from "./AvailableTripsModal";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { useUrlState } from "@/hooks/useUrlState";
import { useProtectedNavigation } from "@/hooks/useProtectedNavigation";
import { Routes, Route, useNavigate } from "react-router-dom";
import { usePendingActions } from "@/hooks/usePendingActions";
import { useOptimizedRealtime } from "@/hooks/useOptimizedRealtime";
import { useStickyState } from "@/hooks/useStickyState";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AcquisitionSurveyModal from "./AcquisitionSurveyModal";
import { useAcquisitionSurvey } from "@/hooks/useAcquisitionSurvey";
import ReferralAnnouncementModal from "./dashboard/ReferralAnnouncementModal";



import UserManagement from "./admin/UserManagement";

import { NotificationBadge } from "@/components/ui/notification-badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { supabase } from "@/integrations/supabase/client";
import { parsePhoneNumber } from "@/lib/phoneUtils";
import { canCancelPackage } from "@/lib/permissions";

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

  // Navigation function that shows profile modal if incomplete
  navigateToForm = (formType: 'package' | 'trip') => {
    navigateToFormWithProfileCheck(formType, () => {
      setShowProfileCompletionModal(true);
    });
  };
  
  const [showAvailableTripsModal, setShowAvailableTripsModal] = useState(false);
  const [showPrimeModal, setShowPrimeModal] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
  
  // Acquisition Survey Logic
  const { needsSurvey } = useAcquisitionSurvey();
  const [showAcquisitionSurvey, setShowAcquisitionSurvey] = useState(false);
  const [surveyDismissed, setSurveyDismissed] = useState(false);
  const [showReferralAnnouncement, setShowReferralAnnouncement] = useState(false);

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
    selectedTripId,
    setSelectedTripId,
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
    markPackageMessagesAsRead,
    loadMorePackages,
    hasMorePackages,
    totalPackages,
    autoApprovedPayments,
    approvedPaymentsData,
    autoApprovedPaymentsLoading,
    approvedPaymentsLoading,
    loadAutoApprovedPayments,
    loadApprovedPayments,
    viewMode,
    setViewMode,
    // URL-based navigation (from notifications)
    urlPackageId,
    urlOpenChat,
    urlTripId,
    clearUrlNavigation,
    recentMutationsRef
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
    handleConfirmShopperReceived,
    handleDismissExpiredPackage
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

  const navigate = useNavigate();
  const pendingActions = usePendingActions(packages, trips, currentUser);
  
  // Auto-show profile completion modal if profile is incomplete
  useEffect(() => {
    if (!isProfileComplete && profile && !showProfile && !showProfileCompletionModal) {
      // Delay to avoid showing immediately on load
      const timer = setTimeout(() => {
        setShowProfileCompletionModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isProfileComplete, profile, showProfile, showProfileCompletionModal]);

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

  // Determine effective admin visibility based on viewMode
  // If admin is viewing as 'user', they shouldn't see admin tabs
  const isAdminViewingAsAdmin = isAdmin && viewMode === 'admin';

  // Redirect to operations page when admin switches to operations view
  const handleViewModeChange = (mode: typeof viewMode) => {
    if (mode === 'operations') {
      navigate('/operations');
    } else {
      setViewMode(mode);
    }
  };
  
  // Filter packages and trips for current user
  const userPackages = packages.filter(pkg => pkg.user_id === currentUser.id);
  const userTrips = trips.filter(trip => trip.user_id === currentUser.id);
  
  // Debug: Log user trips filtering
  console.log('🔍 Debugging trips filtering:', {
    currentUserId: currentUser.id,
    totalTrips: trips.length,
    userTrips: userTrips.length,
    allTripUserIds: trips.map(t => t.user_id).slice(0, 5),
    userTripsData: userTrips.slice(0, 3)
  });
  
  // Filter user trips based on inactive preference
  const filteredUserTrips = userTrips.filter(trip => {
    // Filter out inactive trips if user preference is enabled
    const inactiveStatuses = ['completed', 'rejected', 'cancelled', 'completed_paid'];
    const isActive = !inactiveStatuses.includes(trip.status);
    const shouldShow = !hideInactiveTrips || isActive;
    
    return shouldShow;
  });
  
  // Get packages assigned to user's trips (for traveler view)
  // Note: traveler_dismissed_at filter removed - we now rely solely on matched_trip_id
  // When quotes expire, the cron job auto-cleans matched_trip_id so packages don't appear here
  const assignedPackages = packages.filter(pkg => {
    // Check if package is assigned to any of user's trips
    if (pkg.matched_trip_id && userTrips.some(trip => trip.id === pkg.matched_trip_id)) {
      return true;
    }
    
    // Fallback: Check if package has trip data with user's profile
    if (pkg.matched_trip_id && (pkg as any).trips?.profiles?.id === currentUser.id) {
      return true;
    }
    
    return false;
  });

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
    packages,
    recentMutationsRef
  });

  const handleUpdateUser = async (userData: any) => {
    try {
      // Normalize phone fields
      let country_code = userData.country_code ?? userData.countryCode ?? null;
      let phone_number = userData.phone_number ?? null;

      // Fallback: parse combined phone if needed
      if (!phone_number && userData.phone) {
        const parsed = parsePhoneNumber(userData.phone);
        phone_number = parsed.phoneNumber;
        if (!country_code) country_code = parsed.countryCode;
      }

      const updates = {
        first_name: userData.firstName || userData.first_name,
        last_name: userData.lastName || userData.last_name,
        username: userData.username,
        country_code,
        phone_number,
        avatar_url: userData.avatarUrl || userData.avatar_url,
        bank_account_holder: userData.bank_account_holder || userData.bankAccountHolder,
        bank_name: userData.bank_name || userData.bankName,
        bank_account_type: userData.bank_account_type || userData.bankAccountType,
        bank_account_number: userData.bank_account_number || userData.bankAccountNumber
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id);

      if (error) {
        return;
      }

      // Update local state with normalized values
      setCurrentUser((prev: any) => ({
        ...prev,
        ...userData,
        ...updates,
        name: `${updates.first_name ?? ''} ${updates.last_name ?? ''}`.trim(),
      }));
    } catch (error) {
      // Error silently handled
    }
  };

  const { getStatusBadge } = useStatusHelpers();

  // Mostrar encuesta de adquisición si es necesario
  const handleSurveyComplete = () => {
    setShowAcquisitionSurvey(false);
    setSurveyDismissed(true);
  };

  // Check if survey needs to be shown
  if (!showAcquisitionSurvey && !surveyDismissed && needsSurvey()) {
    setShowAcquisitionSurvey(true);
  }

  // Show referral announcement (after survey is done or not needed), unless dismissed permanently
  useEffect(() => {
    if (!currentUser.id) return;
    if (showAcquisitionSurvey || !isProfileComplete) return;
    const dismissed = localStorage.getItem(`referral_announcement_dismissed_${currentUser.id}`) === 'true';
    if (dismissed) return;
    const timer = setTimeout(() => {
      setShowReferralAnnouncement(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentUser.id, showAcquisitionSurvey, isProfileComplete]);

  const handleReferralAnnouncementClose = () => {
    setShowReferralAnnouncement(false);
  };

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
          onShowPrime={() => setShowPrimeModal(true)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
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
    if (status === 'pending_purchase') {
      handleConfirmPayment(id);
    } else {
      handleStatusUpdate(type, id, status);
    }
  };

  const handleDiscardPackage = async (pkg: any) => {
    // Validar si se puede cancelar (admins pueden cancelar cualquier paquete)
    if (!canCancelPackage(pkg, currentUser.id, currentUser?.role)) {
      toast({
        title: "No se puede cancelar",
        description: "Este pedido no puede ser cancelado porque el pago ya fue procesado o el proceso está muy avanzado.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('📦 Cancelling package:', pkg.id, 'by admin:', currentUser?.role === 'admin');
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


  const handleRequestRequote = async (pkg: any) => {
    try {
      console.log('🔄 Requesting new quote for package:', pkg.id);
      
      // Update package status back to approved for new matching
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: 'approved',
          wants_requote: true,
          quote: null,
          matched_trip_id: null,
          traveler_address: null,
          matched_trip_dates: null,
          quote_expires_at: null
        })
        .eq('id', pkg.id);

      if (error) {
        console.error('❌ Error requesting requote:', error);
        toast({
          title: "Error",
          description: "No se pudo solicitar nueva cotización. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Solicitud enviada",
        description: "Tu paquete está nuevamente disponible para recibir cotizaciones de viajeros.",
      });

      // Refresh packages to update the UI
      if (refreshPackages) {
        await refreshPackages();
      }
    } catch (error) {
      console.error('❌ Error requesting requote:', error);
      toast({
        title: "Error",
        description: "No se pudo solicitar nueva cotización. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setActiveTab('profile')}
          onLogout={signOut}
          onShowUserManagement={() => setShowUserManagement(true)}
          onShowPrime={() => setShowPrimeModal(true)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />

      <div className="container mx-auto mobile-container py-4 sm:py-6 lg:py-8 max-w-full overflow-x-hidden">
        <PhoneNumberBannerSection />
        
        
        {activeTab !== 'profile' && (
          <div className="mb-6 sm:mb-8">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 ${
              (currentUser?.trust_level === 'prime' || (currentUser?.prime_expires_at && new Date(currentUser.prime_expires_at) > new Date())) 
                ? 'text-purple-600' 
                : ''
            }`}>
              ¡Hola, {currentUser?.name || currentUser?.firstName || currentUser?.first_name || 'Usuario'}! 👋
              {(currentUser?.trust_level === 'prime' || (currentUser?.prime_expires_at && new Date(currentUser.prime_expires_at) > new Date())) && (
                <span title="Usuario Prime">
                  <Star className="h-5 w-5 text-purple-500 fill-purple-500" />
                </span>
              )}
            </h2>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {activeTab !== 'profile' && (
            <TabsList className={cn(
              "w-full h-auto min-h-10 grid",
              isAdminViewingAsAdmin ? "grid-cols-5" : "grid-cols-3",
              "gap-1 p-1"
            )}>
              {isAdminViewingAsAdmin && (
                <TabsTrigger 
                  value="admin-dashboard" 
                  className="text-xs sm:text-sm px-2 py-2"
                >
                  Dashboard
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="overview" 
                className="text-xs sm:text-sm px-2 py-2"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="packages" 
                className="relative text-xs sm:text-sm px-2 py-2 flex items-center justify-center gap-1"
              >
                <span className="hidden sm:inline">Mis Pedidos</span>
                <span className="sm:hidden">Pedidos</span>
                {pendingActions.shopperTotal > 0 && (
                  <NotificationBadge 
                    count={pendingActions.shopperTotal} 
                    className="ml-0.5 sm:ml-1"
                  />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="trips" 
                className="relative text-xs sm:text-sm px-2 py-2 flex items-center justify-center gap-1"
              >
                <span className="hidden sm:inline">Mis Viajes</span>
                <span className="sm:hidden">Viajes</span>
                {pendingActions.travelerTotal > 0 && (
                  <NotificationBadge 
                    count={pendingActions.travelerTotal} 
                    className="ml-0.5 sm:ml-1"
                  />
                )}
              </TabsTrigger>
              {isAdminViewingAsAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="relative text-xs sm:text-sm px-2 py-2 flex items-center justify-center gap-1"
                >
                  Admin
                  {pendingActions.adminTotal > 0 && (
                    <NotificationBadge 
                      count={pendingActions.adminTotal} 
                      className="ml-0.5 sm:ml-1"
                    />
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          )}

          {isAdmin && (
            <TabsContent value="admin-dashboard">
              <div className="text-center text-muted-foreground py-12">
                Próximamente...
              </div>
            </TabsContent>
          )}

          <TabsContent value="overview" className="space-y-6">
            <QuickActions 
              onShowPackageForm={() => navigateToForm('package')}
              onShowTripForm={() => navigateToForm('trip')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:order-2">
                <ReferralBanner />
              </div>
              <div className="md:order-1">
                <AvailableTripsCard 
                  onViewTrips={() => setShowAvailableTripsModal(true)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-hidden px-0 sm:px-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Mis Favorones</h3>
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
              // Excluir paquetes archivados y cancelados del dashboard activo
               if (pkg.status === 'archived_by_shopper' || pkg.status === 'cancelled') return false;
               // Ocultar completados solo si ya dieron feedback o lo omitieron
               if (pkg.status === 'completed' && (pkg as any).feedback_completed) return false;
              
              // Excluir paquetes que pertenecen a viajes completados y pagados
              if (pkg.matched_trip_id) {
                const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
                if (matchedTrip && matchedTrip.status === 'completed_paid') return false;
              }
              return true;
            }).length === 0 ? (
              <ProtectedEmptyState
                type="packages"
                onAction={() => navigateToForm('package')}
              />
            ) : (
              <div className="grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 overflow-hidden px-0">
                 {userPackages.filter(pkg => {
                   // Excluir paquetes archivados y cancelados del dashboard activo
                    if (pkg.status === 'archived_by_shopper' || pkg.status === 'cancelled') return false;
                    // Ocultar completados solo si ya dieron feedback o lo omitieron
                    if (pkg.status === 'completed' && (pkg as any).feedback_completed) return false;
                   
                   // Excluir paquetes que pertenecen a viajes completados y pagados
                   if (pkg.matched_trip_id) {
                     const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
                     if (matchedTrip && matchedTrip.status === 'completed_paid') return false;
                   }
                   return true;
                 })
                  .sort((a, b) => {
                    // 1. PRIMERO: Paquetes listos para recoger (delivered_to_office)
                    const aReadyForPickup = a.status === 'delivered_to_office';
                    const bReadyForPickup = b.status === 'delivered_to_office';
                    
                    if (aReadyForPickup && !bReadyForPickup) return -1;
                    if (!aReadyForPickup && bReadyForPickup) return 1;
                    
                    // 2. LUEGO: Completados al final
                    const completedStatuses = ['delivered', 'completed'];
                    const aCompleted = completedStatuses.includes(a.status);
                    const bCompleted = completedStatuses.includes(b.status);
                    
                    if (aCompleted && !bCompleted) return 1;
                    if (!aCompleted && bCompleted) return -1;
                    
                    // 3. FINALMENTE: Por fecha de creación (más recientes primero)
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
                         onDeletePackage={handleDiscardPackage}
                         
                         onRequestRequote={handleRequestRequote}
                        viewMode="user"
                        // URL-based navigation from notifications
                        forceOpen={urlPackageId === pkg.id}
                        forceTab={urlPackageId === pkg.id && urlOpenChat ? "chat" : undefined}
                        onExternalControlHandled={urlPackageId === pkg.id ? clearUrlNavigation : undefined}
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
                  <>
                    {filteredUserTrips.length > 1 && (
                      <TripSelector
                        trips={filteredUserTrips}
                        selectedTripId={selectedTripId}
                        onTripSelect={setSelectedTripId}
                        getStatusBadge={(status) => getStatusBadge(status, { context: 'trip' })}
                      />
                    )}
                    <div className="grid gap-4">
                      {filteredUserTrips
                        .filter(trip => !selectedTripId || trip.id === selectedTripId)
                        .map((trip) => (
                          <TripCard
                            key={trip.id}
                            trip={trip}
                            getStatusBadge={(status) => getStatusBadge(status, { context: 'trip' })}
                            onEditTrip={handleEditTrip}
                            currentUser={currentUser}
                            travelerProfile={currentUser}
                            packages={assignedPackages.filter(pkg => pkg.matched_trip_id === trip.id)}
                          />
                        ))}
                    </div>
                  </>
                )}
              </div>

              {/* Assigned Packages Section */}
              {assignedPackages.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Mis Paquetes Asignados</h4>
                   
                   {/* Mini resumen de paquetes asignados */}
                   <div className="bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg p-4 mb-6 border border-border/50">
                     <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                           <div className="text-xl font-bold text-primary">
                             Q{assignedPackages
                               .filter(pkg => {
                                 // Filter by selected trip
                                 if (selectedTripId && pkg.matched_trip_id !== selectedTripId) {
                                   return false;
                                 }
                                 // Exclude packages from completed and paid trips
                                 const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
                                 if (matchedTrip && matchedTrip.status === 'completed_paid') {
                                   return false;
                                 }
                                 return ['pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'].includes(pkg.status);
                               })
                               .reduce((sum, pkg) => {
                                  const tip = (pkg as any).products_data && Array.isArray((pkg as any).products_data) && (pkg as any).products_data.length > 0
                                    ? (pkg as any).products_data.filter((product: any) => !product.cancelled).reduce((sum: number, product: any) => sum + parseFloat(String(product.adminAssignedTip || '0')), 0)
                                   : parseFloat(String((pkg as any).admin_assigned_tip || '0'));
                                 return sum + tip;
                               }, 0).toFixed(2)}
                           </div>
                          <div className="text-xs text-muted-foreground font-medium">Tips Confirmados</div>
                        </div>
                        <div>
                           <div className="text-xl font-bold text-foreground">
                             {assignedPackages.filter(pkg => {
                               // Filter by selected trip
                               if (selectedTripId && pkg.matched_trip_id !== selectedTripId) {
                                 return false;
                               }
                               // Exclude packages from completed and paid trips
                               const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
                               if (matchedTrip && matchedTrip.status === 'completed_paid') {
                                 return false;
                               }
                               // Exclude expired, cancelled and rejected packages
                               const inactiveStatuses = ['quote_expired', 'cancelled', 'rejected'];
                               return !inactiveStatuses.includes(pkg.status);
                             }).length}
                           </div>
                          <div className="text-xs text-muted-foreground font-medium">Paquetes Asignados</div>
                        </div>
                     </div>
                   </div>
                   
                   {/* Display all assigned packages directly */}
                   <div className="space-y-6">
                       {assignedPackages
                          .filter(pkg => {
                            // First filter by selected trip
                            if (selectedTripId && pkg.matched_trip_id !== selectedTripId) {
                              return false;
                            }
                            
                            // Exclude packages from completed and paid trips, EXCEPT those with incidents
                           const matchedTrip = trips.find(trip => trip.id === pkg.matched_trip_id);
                           if (matchedTrip && matchedTrip.status === 'completed_paid') {
                             // Keep incident packages visible for tracking/resolution
                             if (!pkg.incident_flag) {
                               return false;
                             }
                           }
                           
                           const now = Date.now();
                           const PAID_OR_POST_PAYMENT = [
                             'pending_purchase',
                             'payment_pending_approval',
                             'paid',
                             
                             'shipped',
                             'in_transit',
                             'received_by_traveler',
                             'pending_office_confirmation',
                             'delivered_to_office',
                             'ready_for_pickup',
                             'ready_for_delivery',
                             'completed'
                           ];
                            const isTimerActive = (pkg: any) => (
                              (pkg.status === 'matched' && pkg.matched_assignment_expires_at && new Date(pkg.matched_assignment_expires_at).getTime() > now) ||
                              ((pkg.status === 'quote_sent' || pkg.status === 'payment_pending') && pkg.quote_expires_at && new Date(pkg.quote_expires_at).getTime() > now)
                            );
                            // Also include packages where the quote HAS expired but status hasn't been updated yet by backend
                            const hasExpiredTimer = (pkg: any) => (
                              (pkg.status === 'quote_sent' || pkg.status === 'payment_pending') && 
                              pkg.quote_expires_at && 
                              new Date(pkg.quote_expires_at).getTime() <= now
                            );
                            const isPaidOrPostPayment = (status: string) => PAID_OR_POST_PAYMENT.includes(status);
                            // Include quote_expired packages so traveler can dismiss them (both explicit status and expired timer)
                            const isExpiredQuote = pkg.status === 'quote_expired' || hasExpiredTimer(pkg);
                            return isTimerActive(pkg) || isPaidOrPostPayment(pkg.status) || isExpiredQuote;
                         })
                        .sort((a, b) => {
                          // Priority 1: Packages with pending actions first
                          const aPendingAction = ['matched', 'in_transit', 'pending_office_confirmation'].includes(a.status);
                          const bPendingAction = ['matched', 'in_transit', 'pending_office_confirmation'].includes(b.status);
                          if (aPendingAction && !bPendingAction) return -1;
                          if (!aPendingAction && bPendingAction) return 1;
                          
                          // Priority 2: Packages with countdown timers
                          const now = Date.now();
                          const aHasCountdown = (a.status === 'quote_sent' || a.status === 'payment_pending') && a.quote_expires_at && new Date(a.quote_expires_at).getTime() > now;
                          const bHasCountdown = (b.status === 'quote_sent' || b.status === 'payment_pending') && b.quote_expires_at && new Date(b.quote_expires_at).getTime() > now;
                          if (aHasCountdown && !bHasCountdown) return -1;
                          if (!aHasCountdown && bHasCountdown) return 1;
                          
                          // Priority 3: Most recent first
                          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        })
                        .map(pkg => {
                          const hasPendingAction = ['matched', 'pending_office_confirmation'].includes(pkg.status);
                          const now = Date.now();
                          const hasCountdown = (pkg.status === 'quote_sent' || pkg.status === 'payment_pending') && pkg.quote_expires_at && new Date(pkg.quote_expires_at).getTime() > now;
                          
                          return (
                            <CollapsibleTravelerPackageCard
                              key={pkg.id}
                              pkg={pkg}
                              getStatusBadge={getStatusBadge}
                              onQuote={handleQuote}
                              onConfirmReceived={handleConfirmPackageReceived}
                              onConfirmOfficeDelivery={(packageId) => {
                                // Solo actualizar status, sin modal bancario (se acumula automáticamente via trigger)
                                handleConfirmOfficeReception(packageId);
                              }}
                              onDismissExpiredPackage={handleDismissExpiredPackage}
                              updatePackage={updatePackage}
                              hasPendingAction={hasPendingAction}
                              autoExpand={false}
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
              onUpdatePackage={handleEditPackage}
              onRefreshPackages={refreshPackages}
              refreshAdminData={async () => { await refreshPackages(); }}
              unreadCounts={unreadCounts}
              markPackageMessagesAsRead={markPackageMessagesAsRead}
               loadMorePackages={loadMorePackages}
               hasMorePackages={hasMorePackages}
               totalPackages={totalPackages}
               autoApprovedPayments={autoApprovedPayments}
               approvedPaymentsData={approvedPaymentsData}
               autoApprovedPaymentsLoading={autoApprovedPaymentsLoading}
               approvedPaymentsLoading={approvedPaymentsLoading}
               loadAutoApprovedPayments={loadAutoApprovedPayments}
               loadApprovedPayments={loadApprovedPayments}
               />
            </TabsContent>
          )}


          <TabsContent value="profile" className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('overview')}
                  className="flex items-center gap-2"
                >
                  ← Volver al Dashboard
                </Button>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">Mi Perfil Completo</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Información personal, historial de paquetes y viajes
              </p>
            </div>
            
            <UserProfile 
              user={currentUser}
              packages={isAdmin ? packages.filter(pkg => pkg.user_id === currentUser.id) : packages}
              trips={isAdmin ? trips.filter(trip => trip.user_id === currentUser.id) : trips}
              onUpdateUser={handleUpdateUser}
            />
          </TabsContent>
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
            shopper_trust_level: (selectedPackageForQuote as any).profiles?.trust_level || 'basic',
            package_destination: selectedPackageForQuote.package_destination,
            package_destination_country: selectedPackageForQuote.package_destination_country || undefined,
            cityArea: (selectedPackageForQuote.confirmed_delivery_address as any)?.cityArea,
          }}
          userType={quoteUserType}
          existingQuote={selectedPackageForQuote.quote as any}
          tripDates={(selectedPackageForQuote.matched_trip_dates as any) as {
            first_day_packages: string;
            last_day_packages: string;
            delivery_date: string;
            arrival_date: string;
          }}
          tripInfo={(selectedPackageForQuote as any).trips || 
            (selectedPackageForQuote.matched_trip_id 
              ? trips.find(t => t.id === selectedPackageForQuote.matched_trip_id) as any 
              : undefined)}
          onEditTrip={() => {
            const trip = trips.find(t => t.id === selectedPackageForQuote.matched_trip_id);
            if (trip) {
              handleEditTrip(trip);
            }
          }}
          fullPackage={selectedPackageForQuote}
          onPaymentComplete={(updatedPkg) => {
            // Refresh packages after payment
            if (refreshPackages) refreshPackages();
            setShowQuoteDialog(false);
            setSelectedPackageForQuote(null);
          }}
        />
      )}

      <AvailableTripsModal
        isOpen={showAvailableTripsModal}
        onClose={() => setShowAvailableTripsModal(false)}
      />

      {/* Keep EditProfileModal for legacy access from within profile components */}
      <EditProfileModal
        user={currentUser}
        isOpen={showProfile && activeTab !== 'profile'}
        onClose={() => setShowProfile(false)}
        onUpdateUser={handleUpdateUser}
      />

      {/* Prime Modal */}
      <PrimeModal
        isOpen={showPrimeModal}
        onClose={() => setShowPrimeModal(false)}
        user={currentUser}
      />

      {/* Acquisition Survey Modal */}
      <AcquisitionSurveyModal
        isOpen={showAcquisitionSurvey}
        onComplete={handleSurveyComplete}
      />

      {/* Profile Completion Modal - Auto-shows for incomplete profiles */}
      <ProfileCompletionModal
        isOpen={showProfileCompletionModal}
        onClose={() => setShowProfileCompletionModal(false)}
        onComplete={() => {
          setShowProfileCompletionModal(false);
          toast({
            title: "¡Perfil completado!",
            description: "Ahora puedes solicitar paquetes y registrar viajes.",
          });
        }}
        title="Completa tu perfil"
        description="Necesitamos tu información de contacto para que puedas usar la plataforma."
      />

      {/* Referral Announcement Slideshow - shown once */}
      <ReferralAnnouncementModal
        isOpen={showReferralAnnouncement}
        onClose={handleReferralAnnouncementClose}
      />

    </div>
  );
};

export default Dashboard;

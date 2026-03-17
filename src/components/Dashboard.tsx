import { useState, useEffect, useMemo, lazy, Suspense } from "react";

import { Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import PackageRequestForm from "./PackageRequestForm";
import TripForm from "./TripForm";
import AddressConfirmationModal from "./AddressConfirmationModal";
import AdminDashboard from "./AdminDashboard";
import GodModeDashboard from "./admin/GodModeDashboard";

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
    handleDismissExpiredPackage,
    handleAcceptMultiAssignmentQuote
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

  // Inactive trips are now auto-hidden based on status + feedback

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
  
  // Auto-hide trips: rejected/cancelled always, completed/completed_paid only after feedback
  const filteredUserTrips = userTrips.filter(trip => {
    if (trip.status === 'rejected' || trip.status === 'cancelled' || trip.status === 'expired') return false;
    if ((trip.status === 'completed' || trip.status === 'completed_paid') && trip.traveler_feedback_completed) return false;
    return true;
  });
  
  // === Multi-assignment support: fetch package_assignments for user's trips ===
  const [multiAssignedPackages, setMultiAssignedPackages] = useState<any[]>([]);
  const [shopperAssignmentsMap, setShopperAssignmentsMap] = useState<Record<string, any[]>>({});
  
  useEffect(() => {
    const fetchMultiAssignments = async () => {
      if (userTrips.length === 0) {
        setMultiAssignedPackages([]);
        return;
      }
      
      const tripIds = userTrips.map(t => t.id);
      
      const { data: assignments, error } = await supabase
        .from('package_assignments')
        .select('*, packages(*)')
        .in('trip_id', tripIds);
      
      if (error || !assignments) {
        console.error('Error fetching package_assignments:', error);
        setMultiAssignedPackages([]);
        return;
      }
      
      // Filter to only assignments whose package does NOT already have matched_trip_id 
      // pointing to one of user's trips (those are already in regular assignedPackages)
      const multiAssigned = assignments
        .filter(a => {
          const pkg = a.packages as any;
          if (!pkg) return false;
          // Skip if package is already visible via matched_trip_id
          if (pkg.matched_trip_id && tripIds.includes(pkg.matched_trip_id)) return false;
          // Only show active assignment statuses
          if (['rejected', 'expired', 'cancelled'].includes(a.status)) return false;
          return true;
        })
        .map(a => {
          const pkg = a.packages as any;
          return {
            ...pkg,
            // Override with assignment-level data
            matched_trip_id: a.trip_id,
            admin_assigned_tip: a.admin_assigned_tip ?? pkg.admin_assigned_tip,
            quote: a.quote ?? pkg.quote,
            products_data: a.products_data ?? pkg.products_data,
            // Mark as multi-assignment for UI differentiation
            _isMultiAssignment: true,
            _assignmentId: a.id,
            _assignmentStatus: a.status,
            // Assignment-specific fields for QuoteDialog (prevents reading stale package-level data)
            _assignmentQuote: a.quote,
            _assignmentTravelerAddress: a.traveler_address,
            _assignmentMatchedTripDates: a.matched_trip_dates,
          };
        });
      
      setMultiAssignedPackages(multiAssigned);
    };
    
    fetchMultiAssignments();
  }, [userTrips.length, packages]); // Re-fetch when trips or packages change

  // === Shopper-side: fetch multi-assignments for user's own packages ===
  useEffect(() => {
    const fetchShopperAssignments = async () => {
      // Find packages owned by this user that are multi-assignment (no matched_trip_id)
      // Include both 'matched' and 'quote_sent' status — the latter covers packages where
      // the old code incorrectly set package-level status to quote_sent
      const multiMatchedPkgIds = userPackages
        .filter(p => ['matched', 'quote_sent'].includes(p.status) && !p.matched_trip_id)
        .map(p => p.id);
      
      if (multiMatchedPkgIds.length === 0) {
        setShopperAssignmentsMap({});
        return;
      }

      const { data: assignments, error } = await supabase
        .from('package_assignments')
        .select('*')
        .in('package_id', multiMatchedPkgIds)
        .in('status', ['pending', 'quote_sent']);

      if (error || !assignments) {
        console.error('Error fetching shopper assignments:', error);
        setShopperAssignmentsMap({});
        return;
      }

      // Fetch traveler profiles and trip info for these assignments
      const tripIds = [...new Set(assignments.map(a => a.trip_id))];
      const [tripsResult, profilesResult] = await Promise.all([
        supabase.from('trips').select('id, from_city, to_city, delivery_date, user_id').in('id', tripIds),
        // We need traveler profiles via trips
        supabase.from('trips').select('id, user_id, profiles:user_id(first_name, last_name, avatar_url)').in('id', tripIds)
      ]);

      const tripsMap: Record<string, any> = {};
      (tripsResult.data || []).forEach(t => { tripsMap[t.id] = t; });
      const profilesMap: Record<string, any> = {};
      (profilesResult.data || []).forEach((t: any) => {
        if (t.profiles) profilesMap[t.id] = t.profiles;
      });

      // Build map: packageId -> enriched assignments[]
      const map: Record<string, any[]> = {};
      for (const a of assignments) {
        const trip = tripsMap[a.trip_id];
        const profile = profilesMap[a.trip_id];
        const enriched = {
          ...a,
          traveler_first_name: profile?.first_name,
          traveler_last_name: profile?.last_name,
          traveler_avatar_url: profile?.avatar_url,
          trip_from_city: trip?.from_city,
          trip_to_city: trip?.to_city,
          trip_delivery_date: trip?.delivery_date,
        };
        if (!map[a.package_id]) map[a.package_id] = [];
        map[a.package_id].push(enriched);
      }

      setShopperAssignmentsMap(map);
    };

    fetchShopperAssignments();
  }, [userPackages.length, packages]);

  // Get packages assigned to user's trips (for traveler view)
  // Note: traveler_dismissed_at filter removed - we now rely solely on matched_trip_id
  // When quotes expire, the cron job auto-cleans matched_trip_id so packages don't appear here
  const directAssignedPackages = packages.filter(pkg => {
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
  
  // Merge: direct assignments + multi-assignments (dedup by package id per trip)
  const assignedPackages = useMemo(() => {
    const seen = new Set(directAssignedPackages.map(p => `${p.id}_${p.matched_trip_id}`));
    const merged = [...directAssignedPackages];
    for (const mp of multiAssignedPackages) {
      const key = `${mp.id}_${mp.matched_trip_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(mp);
      }
    }
    return merged;
  }, [directAssignedPackages, multiAssignedPackages]);

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
    // Check localStorage (fast) and DB preference
    const localDismissed = localStorage.getItem(`referral_announcement_dismissed_${currentUser.id}`) === 'true';
    const dbDismissed = (currentUser as any).ui_preferences?.referral_announcement_dismissed === true;
    if (localDismissed || dbDismissed) return;
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

      <div className="container mx-auto mobile-container py-2 sm:py-6 lg:py-8 max-w-full overflow-x-hidden box-border">
        <PhoneNumberBannerSection />
        
        
        {activeTab !== 'profile' && (
          <div className="mb-2 sm:mb-6">
            <h2 className={`text-lg sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 ${
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-6 min-w-0 w-full max-w-full overflow-hidden">
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
                  God Mode
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
              <GodModeDashboard
                packages={packages}
                trips={trips}
                userId={user.id}
              />
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

          <TabsContent value="packages" className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-clip px-1">
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
              <div className="grid gap-3 sm:gap-4 md:gap-6 w-full max-w-full min-w-0 overflow-x-clip">
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
                        // Multi-assignment props
                        multiAssignments={shopperAssignmentsMap[pkg.id]}
                        onAcceptMultiAssignmentQuote={handleAcceptMultiAssignmentQuote}
                      />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6 min-w-0 w-full max-w-full overflow-x-clip px-1">
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
                {filteredUserTrips.length === 0 ? (
                  <ProtectedEmptyState type="trips" onAction={() => navigateToForm('trip')} />
                ) : (
                  <>
                    <div className="grid gap-6">
                      {filteredUserTrips.map((trip) => {
                          // Get packages assigned to this specific trip with visibility filtering
                          const now = Date.now();
                          const PAID_OR_POST_PAYMENT = [
                            'pending_purchase', 'payment_pending_approval', 'paid',
                            'shipped', 'in_transit', 'received_by_traveler',
                            'pending_office_confirmation', 'delivered_to_office',
                            'ready_for_pickup', 'ready_for_delivery', 'completed'
                          ];
                          const tripPackages = assignedPackages
                            .filter((pkg: any) => {
                              if (pkg.matched_trip_id !== trip.id) return false;
                              // Exclude packages from completed_paid trips unless incident
                              if (trip.status === 'completed_paid' && !pkg.incident_flag) return false;
                              const isMatched = pkg.status === 'matched';
                              const hasExpiredTimer = (
                                (pkg.status === 'quote_sent' || pkg.status === 'payment_pending') && 
                                pkg.quote_expires_at && 
                                new Date(pkg.quote_expires_at).getTime() <= now
                              );
                              const isPaidOrPostPayment = PAID_OR_POST_PAYMENT.includes(pkg.status);
                              const isExpiredQuote = pkg.status === 'quote_expired' || hasExpiredTimer;
                              const isMultiAssignment = pkg._isMultiAssignment;
                              return isMatched || isPaidOrPostPayment || isExpiredQuote || isMultiAssignment;
                            })
                            .sort((a, b) => {
                              const aPending = ['matched', 'in_transit', 'pending_office_confirmation'].includes(a.status);
                              const bPending = ['matched', 'in_transit', 'pending_office_confirmation'].includes(b.status);
                              if (aPending && !bPending) return -1;
                              if (!aPending && bPending) return 1;
                              const aCountdown = (a.status === 'quote_sent' || a.status === 'payment_pending') && a.quote_expires_at && new Date(a.quote_expires_at).getTime() > now;
                              const bCountdown = (b.status === 'quote_sent' || b.status === 'payment_pending') && b.quote_expires_at && new Date(b.quote_expires_at).getTime() > now;
                              if (aCountdown && !bCountdown) return -1;
                              if (!aCountdown && bCountdown) return 1;
                              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                            });

                          return (
                            <div key={trip.id} className="space-y-3">
                              <TripCard
                                trip={trip}
                                getStatusBadge={(status) => getStatusBadge(status, { context: 'trip' })}
                                onEditTrip={handleEditTrip}
                                currentUser={currentUser}
                                travelerProfile={currentUser}
                                packages={assignedPackages.filter(pkg => pkg.matched_trip_id === trip.id)}
                              />
                              {/* Nested assigned packages for this trip */}
                              {tripPackages.length > 0 && (
                                <div className="ml-1 sm:ml-4 border-l-2 border-primary/20 pl-2 sm:pl-4 space-y-3 min-w-0 max-w-full overflow-hidden">
                                  <p className="text-sm font-medium text-muted-foreground">
                                    📦 {tripPackages.length} paquete{tripPackages.length !== 1 ? 's' : ''} asignado{tripPackages.length !== 1 ? 's' : ''}
                                  </p>
                                  {tripPackages.map(pkg => {
                                    const hasPendingAction = pkg.status === 'matched';
                                    return (
                                      <CollapsibleTravelerPackageCard
                                        key={pkg.id}
                                        pkg={pkg}
                                        getStatusBadge={getStatusBadge}
                                        onQuote={handleQuote}
                                        onConfirmReceived={handleConfirmPackageReceived}
                                        onConfirmOfficeDelivery={(packageId) => {
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
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
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
            traveler_address: (quoteUserType === 'user' && (selectedPackageForQuote as any)._assignmentTravelerAddress)
              ? (selectedPackageForQuote as any)._assignmentTravelerAddress
              : selectedPackageForQuote.traveler_address || undefined,
            shopper_trust_level: (selectedPackageForQuote as any).profiles?.trust_level || 'basic',
            package_destination: selectedPackageForQuote.package_destination,
            package_destination_country: selectedPackageForQuote.package_destination_country || undefined,
            cityArea: (selectedPackageForQuote.confirmed_delivery_address as any)?.cityArea,
          }}
          userType={quoteUserType}
          existingQuote={quoteUserType === 'user' && (selectedPackageForQuote as any)._assignmentQuote
            ? (selectedPackageForQuote as any)._assignmentQuote
            : selectedPackageForQuote.quote as any}
          tripDates={((quoteUserType === 'user' && (selectedPackageForQuote as any)._assignmentMatchedTripDates
            ? (selectedPackageForQuote as any)._assignmentMatchedTripDates
            : selectedPackageForQuote.matched_trip_dates) as any) as {
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

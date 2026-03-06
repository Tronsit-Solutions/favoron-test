import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedPackagesData } from './useOptimizedPackagesData';
import { useOptimizedTripsData } from './useOptimizedTripsData';
import { useAdminData } from './useAdminData';
import { usePlatformFeesContext } from "@/contexts/PlatformFeesContext";
import type { Package } from "@/types";
import { useSearchParams } from "react-router-dom";

export type ViewMode = 'user' | 'admin' | 'operations';

export const useDashboardState = (user: any) => {
  const [currentUser, setCurrentUser] = useState(user);
  const { rates } = usePlatformFeesContext();
  
  // Stable userId reference to prevent unnecessary refetches on tab switch
  const stableUserId = useMemo(() => user?.id, [user?.id]);
  const userIdRef = useRef(stableUserId);
  if (stableUserId && userIdRef.current !== stableUserId) {
    userIdRef.current = stableUserId;
  }
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial tab from URL, fallback to "overview"
  const getInitialTab = () => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['overview', 'packages', 'trips', 'admin', 'admin-dashboard', 'profile'];
    return validTabs.includes(tabFromUrl || '') ? tabFromUrl : 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [matchingTab, setMatchingTab] = useState(() => {
    const matchingFromUrl = searchParams.get('matching');
    const validMatchingTabs = ['pending', 'trips', 'matches', 'payments'];
    return validMatchingTabs.includes(matchingFromUrl || '') ? matchingFromUrl : 'pending';
  });
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedPackageForAddress, setSelectedPackageForAddress] = useState<Package | null>(null);
  const [selectedPackageForQuote, setSelectedPackageForQuote] = useState<Package | null>(null);
  const [quoteUserType, setQuoteUserType] = useState<'user' | 'admin' | 'operations'>('user');
  
  // URL-based package/chat navigation (for notifications)
  const [urlPackageId, setUrlPackageId] = useState<string | null>(() => searchParams.get('package'));
  const [urlOpenChat, setUrlOpenChat] = useState<boolean>(() => searchParams.get('openChat') === 'true');
  const [urlTripId, setUrlTripId] = useState<string | null>(() => searchParams.get('trip'));
  const [selectedTripId, setSelectedTripId] = useState<string | null>(() => {
    try {
      // Load saved trip selection for this user
      const saved = localStorage.getItem(`trip_filter_${user?.id || 'default'}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // View mode for admins to switch between different perspectives
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(`view_mode_${user?.id || 'default'}`);
      return (saved as ViewMode) || 'admin';
    } catch {
      return 'admin';
    }
  });

  // Persist view mode to localStorage
  useEffect(() => {
    if (user?.id && user?.role === 'admin') {
      try {
        localStorage.setItem(`view_mode_${user.id}`, viewMode);
      } catch (error) {
        console.warn('Failed to save view mode:', error);
      }
    }
  }, [viewMode, user?.id, user?.role]);
  
  // Persist trip selection to localStorage
  useEffect(() => {
    if (user?.id) {
      try {
        if (selectedTripId) {
          localStorage.setItem(`trip_filter_${user.id}`, JSON.stringify(selectedTripId));
        } else {
          localStorage.removeItem(`trip_filter_${user.id}`);
        }
      } catch (error) {
        console.warn('Failed to save trip selection:', error);
      }
    }
  }, [selectedTripId, user?.id]);

  // Check if user is admin to decide which data hooks to use
  const isAdminTab = activeTab === 'admin' || activeTab === 'admin-dashboard';
  const userRole = user?.userRole?.role ?? user?.role;
  
  // Mejorar detección de admin con persistencia temporal
  const [wasAdminUser, setWasAdminUser] = useState(() => {
    try {
      return localStorage.getItem('temp_admin_user_state') === 'true';
    } catch {
      return false;
    }
  });

  const isAdmin = userRole === 'admin';
  
  // Persistir estado de admin user para evitar pérdida durante refresh
  useEffect(() => {
    if (isAdmin) {
      setWasAdminUser(true);
      try {
        localStorage.setItem('temp_admin_user_state', 'true');
      } catch {}
    } else if (userRole && userRole !== 'admin') {
      // Solo limpiar si tenemos un rol definitivo y no es admin
      setWasAdminUser(false);
      try {
        localStorage.removeItem('temp_admin_user_state');
      } catch {}
    }
  }, [isAdmin, userRole]);

  // Determine if we should use admin data BEFORE calling hooks
  const shouldUseAdminData = isAdminTab && (isAdmin || wasAdminUser || (!userRole && wasAdminUser));

  // Use admin-specific hook for admin tab, otherwise use regular hooks
  const adminData = useAdminData();
  
  // Only fetch regular packages data if NOT on admin tab - prevents unnecessary queries and error toasts
  // Use stable userId reference to prevent refetches when user object reference changes
  const regularPackagesData = useOptimizedPackagesData(shouldUseAdminData ? undefined : userIdRef.current, rates);
  const regularTripsData = useOptimizedTripsData();
  
  const {
    packages,
    loading: packagesLoading,
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages,
    setPackages,
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
    loadApprovedPayments
  } = shouldUseAdminData ? {
    packages: adminData.packages,
    loading: adminData.loading,
    createPackage: regularPackagesData.createPackage,
    updatePackage: regularPackagesData.updatePackage,
    deletePackage: regularPackagesData.deletePackage,
    refreshPackages: adminData.refreshData,
    setPackages: () => {}, // Admin data is read-only
    unreadCounts: adminData.unreadCounts,
    markPackageMessagesAsRead: adminData.markPackageMessagesAsRead,
    loadMorePackages: adminData.loadMorePackages,
    hasMorePackages: adminData.hasMorePackages,
    totalPackages: adminData.totalPackages,
    autoApprovedPayments: adminData.autoApprovedPayments,
    approvedPaymentsData: adminData.approvedPaymentsData,
    autoApprovedPaymentsLoading: adminData.autoApprovedPaymentsLoading,
    approvedPaymentsLoading: adminData.approvedPaymentsLoading,
    loadAutoApprovedPayments: adminData.loadAutoApprovedPayments,
    loadApprovedPayments: adminData.loadApprovedPayments
  } : {
    ...regularPackagesData,
    unreadCounts: {},
    markPackageMessagesAsRead: async () => {},
    loadMorePackages: async () => {},
    hasMorePackages: false,
    totalPackages: 0,
    autoApprovedPayments: [],
    approvedPaymentsData: [],
    autoApprovedPaymentsLoading: false,
    approvedPaymentsLoading: false,
    loadAutoApprovedPayments: async () => {},
    loadApprovedPayments: async () => {}
  };

  const recentMutationsRef = regularPackagesData.recentMutationsRef;

  const {
    trips,
    loading: tripsLoading,
    createTrip,
    updateTrip,
    deleteTrip,
    refreshTrips
  } = shouldUseAdminData ? {
    trips: adminData.trips,
    loading: adminData.loading,
    createTrip: regularTripsData.createTrip,
    updateTrip: regularTripsData.updateTrip,
    deleteTrip: regularTripsData.deleteTrip,
    refreshTrips: adminData.refreshData
  } : regularTripsData;
  
  const { toast } = useToast();

  // Sync tab state with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['overview', 'packages', 'trips', 'admin', 'admin-dashboard', 'profile'];
    if (validTabs.includes(tabFromUrl || '') && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    
    // Sync URL-based package/chat params
    const packageFromUrl = searchParams.get('package');
    const openChatFromUrl = searchParams.get('openChat') === 'true';
    const tripFromUrl = searchParams.get('trip');
    
    if (packageFromUrl !== urlPackageId) {
      setUrlPackageId(packageFromUrl);
    }
    if (openChatFromUrl !== urlOpenChat) {
      setUrlOpenChat(openChatFromUrl);
    }
    if (tripFromUrl !== urlTripId) {
      setUrlTripId(tripFromUrl);
    }
  }, [searchParams, activeTab, urlPackageId, urlOpenChat, urlTripId]);
  
  // Function to clear URL navigation params after handling
  const clearUrlNavigation = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('package');
    newParams.delete('openChat');
    newParams.delete('trip');
    setSearchParams(newParams, { replace: true });
    setUrlPackageId(null);
    setUrlOpenChat(false);
    setUrlTripId(null);
  };

  // Update URL when tab changes
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      newParams.delete('tab');
      newParams.delete('matching'); // Clean matching param when leaving admin
    } else {
      newParams.set('tab', tab);
      // Preserve matching tab when switching to admin
      if (tab === 'admin' && matchingTab) {
        newParams.set('matching', matchingTab);
      } else if (tab !== 'admin') {
        newParams.delete('matching');
      }
    }
    setSearchParams(newParams, { replace: true });
  };

  // Handle matching subtab changes
  const handleSetMatchingTab = (subtab: string) => {
    setMatchingTab(subtab);
    const newParams = new URLSearchParams(searchParams);
    if (activeTab === 'admin') {
      newParams.set('matching', subtab);
      setSearchParams(newParams, { replace: true });
    }
  };

  // Completely disabled tab awareness to prevent any automatic refreshes
  // useImprovedTabAwareData({
  //   refreshThreshold: 5 * 60 * 1000, // 5 minutes
  //   enableAutoRefresh: false, // Disabled to prevent modal interruption
  //   onTabActive: () => {
  //     // Only refresh if user explicitly requests it
  //     console.log('Tab became active - data refresh available');
  //   }
  // });

  return {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab: handleSetActiveTab,
    matchingTab,
    setMatchingTab: handleSetMatchingTab,
    showPackageForm,
    setShowPackageForm,
    showTripForm,
    setShowTripForm,
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
    packagesLoading,
    tripsLoading,
    // Database operations
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages,
    createTrip,
    updateTrip,
    deleteTrip,
    refreshTrips,
    setPackages,
    toast,
    unreadCounts,
    markPackageMessagesAsRead,
    // Pagination for admin
    loadMorePackages,
    hasMorePackages,
    totalPackages,
    autoApprovedPayments,
    approvedPaymentsData,
    autoApprovedPaymentsLoading,
    approvedPaymentsLoading,
    loadAutoApprovedPayments,
    loadApprovedPayments,
    // View mode for admin role switching
    viewMode,
    setViewMode,
    // URL-based navigation (for notifications)
    urlPackageId,
    urlOpenChat,
    urlTripId,
    clearUrlNavigation,
    // Mutation tracker for realtime
    recentMutationsRef
  };
};
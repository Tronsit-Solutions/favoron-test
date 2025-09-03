import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedPackagesData } from './useOptimizedPackagesData';
import { useOptimizedTripsData } from './useOptimizedTripsData';
import { useAdminData } from './useAdminData';
import type { Package } from "@/types";
import { useSearchParams } from "react-router-dom";

export const useDashboardState = (user: any) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial tab from URL, fallback to "overview"
  const getInitialTab = () => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['overview', 'packages', 'trips', 'admin'];
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
  const [quoteUserType, setQuoteUserType] = useState<'user' | 'admin'>('user');
  
  // Check if user is admin to decide which data hooks to use
  const isAdminTab = activeTab === 'admin';
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

  // Always call all hooks unconditionally to maintain hook order
  const adminData = useAdminData();
  const regularPackagesData = useOptimizedPackagesData();
  const regularTripsData = useOptimizedTripsData();

  // Siempre usar datos de admin cuando se está en la pestaña de admin para evitar estados vacíos temporales
  const shouldUseAdminData = isAdminTab;
  
  // Select which data to use without conditionally calling hooks
  const packages = shouldUseAdminData ? adminData.packages : regularPackagesData.packages;
  const packagesLoading = shouldUseAdminData ? adminData.loading : regularPackagesData.loading;
  const createPackage = regularPackagesData.createPackage;
  const updatePackage = regularPackagesData.updatePackage;
  const deletePackage = regularPackagesData.deletePackage;
  const refreshPackages = shouldUseAdminData ? adminData.refreshData : regularPackagesData.refreshPackages;
  const setPackages = shouldUseAdminData ? () => {} : regularPackagesData.setPackages; // Admin data is read-only

  const trips = shouldUseAdminData ? adminData.trips : regularTripsData.trips;
  const tripsLoading = shouldUseAdminData ? adminData.loading : regularTripsData.loading;
  const createTrip = regularTripsData.createTrip;
  const updateTrip = regularTripsData.updateTrip;
  const deleteTrip = regularTripsData.deleteTrip;
  const refreshTrips = shouldUseAdminData ? adminData.refreshData : regularTripsData.refreshTrips;
  
  const { toast } = useToast();

  // Sync tab state with URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const validTabs = ['overview', 'packages', 'trips', 'admin'];
    if (validTabs.includes(tabFromUrl || '') && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

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
    toast
  };
};
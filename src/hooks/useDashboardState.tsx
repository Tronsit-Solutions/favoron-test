import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedPackagesData } from './useOptimizedPackagesData';
import { useOptimizedTripsData } from './useOptimizedTripsData';
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
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedPackageForAddress, setSelectedPackageForAddress] = useState<Package | null>(null);
  const [selectedPackageForQuote, setSelectedPackageForQuote] = useState<Package | null>(null);
  const [quoteUserType, setQuoteUserType] = useState<'user' | 'admin'>('user');
  
  // Re-enabled data hooks for full functionality
  const {
    packages,
    loading: packagesLoading,
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages,
    setPackages
  } = useOptimizedPackagesData();

  const {
    trips,
    loading: tripsLoading,
    createTrip,
    updateTrip,
    deleteTrip,
    refreshTrips
  } = useOptimizedTripsData();
  
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
      newParams.delete('tab'); // Clean URL for overview
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
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
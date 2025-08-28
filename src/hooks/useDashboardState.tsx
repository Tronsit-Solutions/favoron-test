import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
// Disabled optimized data hooks to prevent conflicts with AdminDashboard's consolidated system
// import { useOptimizedPackagesData } from './useOptimizedPackagesData';
// import { useOptimizedTripsData } from './useOptimizedTripsData';
// import { useImprovedTabAwareData } from './useImprovedTabAwareData';
import type { Package } from "@/types";

export const useDashboardState = (user: any) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedPackageForAddress, setSelectedPackageForAddress] = useState<Package | null>(null);
  const [selectedPackageForQuote, setSelectedPackageForQuote] = useState<Package | null>(null);
  const [quoteUserType, setQuoteUserType] = useState<'user' | 'admin'>('user');
  
  // Disabled data hooks to prevent conflicts with AdminDashboard's consolidated system
  // AdminDashboard now manages its own localPackages and localTrips
  const packages: Package[] = [];
  const trips: any[] = [];
  const packagesLoading = false;
  const tripsLoading = false;
  
  // Placeholder functions for compatibility
  const createPackage = async () => {};
  const updatePackage = async () => {};
  const deletePackage = async () => {};
  const refreshPackages = () => {};
  const setPackages = () => {};
  const createTrip = async () => {};
  const updateTrip = async () => {};
  const deleteTrip = async () => {};
  const refreshTrips = () => {};
  
  const { toast } = useToast();

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
    setActiveTab,
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
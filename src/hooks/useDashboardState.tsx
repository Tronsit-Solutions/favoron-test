import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePackagesData } from './usePackagesData';
import { useTripsData } from './useTripsData';
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
  
  // Use real data hooks
  const { packages, createPackage, updatePackage, deletePackage, refreshPackages } = usePackagesData();
  const { trips, createTrip, updateTrip, deleteTrip, refreshTrips } = useTripsData();
  const { toast } = useToast();

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
    // Database operations
    createPackage,
    updatePackage,
    deletePackage,
    refreshPackages,
    createTrip,
    updateTrip,
    deleteTrip,
    refreshTrips,
    toast
  };
};

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useDashboardState = (user: any) => {
  const [currentUser, setCurrentUser] = useState(user);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showAddressConfirmation, setShowAddressConfirmation] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPackageForAddress, setSelectedPackageForAddress] = useState<any>(null);
  const [selectedPackageForQuote, setSelectedPackageForQuote] = useState<any>(null);
  const [quoteUserType, setQuoteUserType] = useState<'traveler' | 'shopper'>('traveler');
  const [packages, setPackages] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
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
    selectedPackageForAddress,
    setSelectedPackageForAddress,
    selectedPackageForQuote,
    setSelectedPackageForQuote,
    quoteUserType,
    setQuoteUserType,
    packages,
    setPackages,
    trips,
    setTrips,
    toast
  };
};

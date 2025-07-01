
import { usePackageActions } from "./usePackageActions";
import { useTripActions } from "./useTripActions";
import { useQuoteActions } from "./useQuoteActions";
import { useAdminActions } from "./useAdminActions";
import { useToast } from "@/hooks/use-toast";

export const useDashboardActions = (
  packages: any[],
  setPackages: (packages: any[]) => void,
  trips: any[],
  setTrips: (trips: any[]) => void,
  currentUser: any,
  setShowPackageForm: (show: boolean) => void,
  setShowTripForm: (show: boolean) => void,
  setShowAddressConfirmation: (show: boolean) => void,
  setSelectedPackageForAddress: (pkg: any) => void,
  setShowQuoteDialog: (show: boolean) => void,
  setSelectedPackageForQuote: (pkg: any) => void,
  setQuoteUserType: (type: 'traveler' | 'shopper') => void
) => {
  const { toast } = useToast();

  const { handlePackageSubmit, handleUploadDocument } = usePackageActions(
    packages, setPackages, currentUser, setShowPackageForm
  );
  
  const { handleTripSubmit } = useTripActions(
    trips, setTrips, currentUser, setShowTripForm
  );
  
  const { handleQuoteSubmit, handleQuote } = useQuoteActions(
    packages, setPackages, setShowQuoteDialog, setSelectedPackageForQuote
  );
  
  const { handleConfirmPayment, handleMatchPackage, handleStatusUpdate, handleApproveReject } = useAdminActions(
    packages, setPackages, trips, setTrips
  );

  const handleAddressConfirmation = (confirmedAddress: any) => {
    setPackages(packages.map(pkg => 
      pkg.id === currentUser.selectedPackageForAddress?.id 
        ? { ...pkg, status: 'address_confirmed', confirmedDeliveryAddress: confirmedAddress }
        : pkg
    ));
    setShowAddressConfirmation(false);
    setSelectedPackageForAddress(null);
    toast({
      title: "¡Dirección confirmada!",
      description: "El comprador ya puede proceder con la compra y envío.",
    });
  };

  const handleConfirmAddress = (pkg: any) => {
    const mockTripAddress = {
      streetAddress: "5ta Avenida 12-34, Zona 10",
      cityArea: "Guatemala City, Zona 10",
      hotelAirbnbName: "Hotel Casa Santo Domingo",
      contactNumber: "+502 1234-5678"
    };
    setSelectedPackageForAddress({ ...pkg, deliveryAddress: mockTripAddress });
    setShowAddressConfirmation(true);
  };

  const enhancedHandleQuote = (pkg: any, userType: 'traveler' | 'shopper') => {
    setQuoteUserType(userType);
    handleQuote(pkg, userType);
  };

  return {
    handlePackageSubmit,
    handleTripSubmit,
    handleAddressConfirmation,
    handleQuoteSubmit,
    handleQuote: enhancedHandleQuote,
    handleConfirmAddress,
    handleUploadDocument,
    handleConfirmPayment,
    handleMatchPackage,
    handleStatusUpdate,
    handleApproveReject
  };
};

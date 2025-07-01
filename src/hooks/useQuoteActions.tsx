
import { useToast } from "@/hooks/use-toast";

export const useQuoteActions = (
  packages: any[],
  setPackages: (packages: any[]) => void,
  setShowQuoteDialog: (show: boolean) => void,
  setSelectedPackageForQuote: (pkg: any) => void
) => {
  const { toast } = useToast();

  const handleQuoteSubmit = (quoteData: any, selectedPackage: any, userType: 'traveler' | 'shopper') => {
    if (userType === 'traveler') {
      setPackages(packages.map(pkg => 
        pkg.id === selectedPackage.id 
          ? { ...pkg, status: 'quote_sent', quote: quoteData }
          : pkg
      ));
      toast({
        title: "¡Cotización enviada!",
        description: "Tu cotización ha sido enviada al comprador.",
      });
    } else {
      if (quoteData.message === 'accepted') {
        setPackages(packages.map(pkg => 
          pkg.id === selectedPackage.id 
            ? { ...pkg, status: 'quote_accepted' }
            : pkg
        ));
        toast({
          title: "¡Cotización aceptada!",
          description: "Ahora debes hacer el pago a la cuenta bancaria de Favorón.",
        });
      } else {
        setPackages(packages.map(pkg => 
          pkg.id === selectedPackage.id 
            ? { ...pkg, status: 'quote_rejected' }
            : pkg
        ));
        toast({
          title: "Cotización rechazada",
          description: "Has rechazado la cotización del viajero.",
        });
      }
    }
    setShowQuoteDialog(false);
    setSelectedPackageForQuote(null);
  };

  const handleQuote = (pkg: any, userType: 'traveler' | 'shopper') => {
    setSelectedPackageForQuote(pkg);
    setShowQuoteDialog(true);
  };

  return {
    handleQuoteSubmit,
    handleQuote
  };
};

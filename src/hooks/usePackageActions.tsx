
import { useToast } from "@/hooks/use-toast";

export const usePackageActions = (
  packages: any[],
  setPackages: (packages: any[]) => void,
  currentUser: any,
  setShowPackageForm: (show: boolean) => void
) => {
  const { toast } = useToast();

  const handlePackageSubmit = (packageData: any) => {
    const newPackage = {
      id: Date.now(),
      ...packageData,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };
    setPackages([...packages, newPackage]);
    setShowPackageForm(false);
    toast({
      title: "¡Solicitud enviada!",
      description: "Tu solicitud de paquete está en revisión. Te notificaremos pronto.",
    });
  };

  const handleUploadDocument = (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const updatedPkg = { ...pkg };
        if (type === 'confirmation') {
          updatedPkg.purchaseConfirmation = data;
          updatedPkg.status = 'purchased';
        } else if (type === 'tracking') {
          updatedPkg.trackingInfo = data;
          updatedPkg.status = 'in_transit';
        } else if (type === 'payment_receipt') {
          updatedPkg.paymentReceipt = data;
          updatedPkg.status = 'payment_pending';
        }
        return updatedPkg;
      }
      return pkg;
    }));

    const messages = {
      payment_receipt: {
        title: "¡Pago registrado!",
        description: "Tu pago está en revisión. Te notificaremos cuando sea confirmado."
      },
      confirmation: {
        title: "¡Comprobante de compra subido!",
        description: "Se ha registrado tu comprobante de compra."
      },
      tracking: {
        title: "¡Información de seguimiento actualizada!",
        description: "Se ha registrado la información de envío."
      }
    };

    const message = messages[type];
    if (message) {
      toast(message);
    }
  };

  return {
    handlePackageSubmit,
    handleUploadDocument
  };
};

import { useToast } from "@/hooks/use-toast";
import { Package, DocumentType } from "@/types";

export const usePackageActions = (
  packages: Package[],
  setPackages: (packages: Package[]) => void
) => {
  const { toast } = useToast();

  const handleUploadDocument = (packageId: string, type: DocumentType, data: any) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const updatedPkg = { ...pkg };
        if (type === 'confirmation') {
          updatedPkg.purchase_confirmation = data;
          if (updatedPkg.tracking_info) {
            updatedPkg.status = 'in_transit';
          }
        } else if (type === 'tracking') {
          updatedPkg.tracking_info = data;
          if (updatedPkg.purchase_confirmation) {
            updatedPkg.status = 'in_transit';
          }
        } else if (type === 'payment_receipt') {
          updatedPkg.payment_receipt = data;
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

  const handleConfirmPackageReceived = (packageId: string, photo?: string) => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId
        ? { 
            ...pkg, 
            status: 'received_by_traveler',
            travelerConfirmation: {
              confirmedAt: new Date().toISOString(),
              photo: photo || null
            }
          }
        : pkg
    ));
    
    toast({
      title: "¡Paquete confirmado!",
      description: "Has confirmado la recepción del paquete.",
    });
  };

  const handleEditPackage = (editedPackageData: Package) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === editedPackageData.id) {
        const newStatus = pkg.status === 'approved' ? 'pending_approval' : pkg.status;
        return { ...editedPackageData, created_at: pkg.created_at, user_id: pkg.user_id, status: newStatus };
      }
      return pkg;
    }));
    
    const originalPackage = packages.find(pkg => pkg.id === editedPackageData.id);
    const needsReapproval = originalPackage?.status === 'approved';
    
    toast({
      title: "¡Solicitud actualizada!",
      description: needsReapproval 
        ? "Los cambios se han guardado. La solicitud requiere nueva aprobación del administrador."
        : "Los cambios se han guardado correctamente.",
    });
  };

  return {
    handleUploadDocument,
    handleConfirmPackageReceived,
    handleEditPackage
  };
};
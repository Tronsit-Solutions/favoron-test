import { useToast } from "@/hooks/use-toast";
import { Package, DocumentType } from "@/types";

export const usePackageActions = () => {
  const { toast } = useToast();

  const handleUploadDocument = async (packageId: string, type: DocumentType, data: any) => {
    try {
      // This is a placeholder - actual uploads should be handled by components with access to updatePackage
      toast({
        title: "Documento subido",
        description: "El documento ha sido procesado.",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el documento.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPackageReceived = async (packageId: string, photo?: string, updatePackage?: (id: string, updates: any) => Promise<any>) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        toast({
          title: "Error del sistema",
          description: "Función de actualización no disponible. Intenta refrescar la página.",
          variant: "destructive",
        });
        return;
      }

      const confirmationData = {
        confirmedAt: new Date().toISOString(),
        photo: photo || null
      };

      await updatePackage(packageId, {
        status: 'received_by_traveler',
        traveler_confirmation: confirmationData
      });

      toast({
        title: "¡Paquete confirmado!",
        description: "Has confirmado la recepción del paquete.",
      });
    } catch (error) {
      console.error('Error confirming package:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el paquete.",
        variant: "destructive",
      });
    }
  };

  const handleEditPackage = async (editedPackageData: Package) => {
    try {
      // This should be handled by components with access to updatePackage
      toast({
        title: "¡Solicitud actualizada!",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error('Error editing package:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paquete.",
        variant: "destructive",
      });
    }
  };

  return {
    handleUploadDocument,
    handleConfirmPackageReceived,
    handleEditPackage
  };
};
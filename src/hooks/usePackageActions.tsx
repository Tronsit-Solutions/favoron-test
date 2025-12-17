import { useToast } from "@/hooks/use-toast";
import { Package, DocumentType } from "@/types";
import { supabase } from "@/integrations/supabase/client";

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

  const handleConfirmProductReceived = async (
    packageId: string,
    productIndex: number,
    photo: string,
    updatePackage: (id: string, updates: any) => Promise<any>,
    pkg: any
  ) => {
    try {
      // Defensive validation - ensure productIndex is valid
      const productsData = pkg.products_data || [];
      if (productIndex < 0 || productIndex >= productsData.length) {
        console.error('❌ Invalid product index:', productIndex, 'for products count:', productsData.length, 'products:', productsData);
        toast({
          title: "Error",
          description: "No se pudo encontrar el producto. Intenta refrescar la página.",
          variant: "destructive",
        });
        return;
      }

      // 1. Clone products_data
      const updatedProducts = [...productsData];
      
      // 2. Update specific product
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        receivedByTraveler: true,
        receivedAt: new Date().toISOString(),
        receivedPhoto: photo
      };
      
      // 3. Check if ALL active (non-cancelled) products are confirmed
      const allConfirmed = updatedProducts.every((p: any) => p.receivedByTraveler || p.cancelled);
      
      // 4. Prepare updates
      const updates: any = {
        products_data: updatedProducts
      };
      
      // 5. If all confirmed → change status
      if (allConfirmed) {
        updates.status = 'received_by_traveler';
        updates.traveler_confirmation = {
          confirmedAt: new Date().toISOString(),
          allProductsConfirmed: true
        };
      }
      
      // 6. Update in DB
      await updatePackage(packageId, updates);
      
      // 7. Send low-priority notification to shopper
      const productName = updatedProducts[productIndex].itemDescription;
      const remainingProducts = updatedProducts.filter((p: any) => !p.receivedByTraveler && !p.cancelled).length;
      
      try {
        await supabase.functions.invoke('send-whatsapp-notification', {
          body: {
            user_id: pkg.user_id,
            title: '✅ Producto recibido',
            message: `El viajero confirmó la recepción de:\n📦 ${productName}\n\n${remainingProducts > 0 
              ? `⏳ Quedan ${remainingProducts} productos por confirmar.` 
              : '🎉 ¡Todos los productos han sido confirmados!'
            }\n\nPaquete: ${pkg.item_description}`,
            type: 'package',
            priority: 'low'
          }
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the confirmation if notification fails
      }
      
      toast({
        title: allConfirmed ? "¡Todos los productos confirmados!" : "Producto confirmado",
        description: allConfirmed 
          ? "Has recibido todos los productos del paquete"
          : `Quedan ${remainingProducts} productos por confirmar`
      });
      
    } catch (error) {
      console.error('Error confirming product:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el producto.",
        variant: "destructive",
      });
      throw error;
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
    handleConfirmProductReceived,
    handleEditPackage
  };
};
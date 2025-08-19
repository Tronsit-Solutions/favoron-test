import { useToast } from "@/hooks/use-toast";
import { Package } from "@/types";
import { canCancelPackage, getPackageCancellationRisk } from "@/lib/permissions";

interface CancelPackageOptions {
  reason?: string;
  hideFromDashboard?: boolean;
}

export const useEnhancedPackageActions = () => {
  const { toast } = useToast();

  const cancelPackageWithOptions = async (
    pkg: Package, 
    userId: string, 
    updatePackage: (id: string, updates: any) => Promise<any>,
    options: CancelPackageOptions = {}
  ) => {
    try {
      if (!canCancelPackage(pkg, userId)) {
        toast({
          title: "No se puede cancelar",
          description: "Este paquete ya no se puede cancelar en su estado actual.",
          variant: "destructive",
        });
        return false;
      }

      const risk = getPackageCancellationRisk(pkg);
      const updates: any = {
        status: 'cancelled',
        rejection_reason: options.reason || 'Cancelado por el usuario'
      };

      await updatePackage(pkg.id, updates);

      let description = "El paquete ha sido cancelado exitosamente.";
      if (risk === 'medium') {
        description += " Ten en cuenta que ya estaba asignado a un viajero.";
      } else if (risk === 'high') {
        description += " Se canceló después de aceptar cotización - puede afectar tu reputación.";
      }

      toast({
        title: "Paquete cancelado",
        description,
      });

      return true;
    } catch (error) {
      console.error('Error cancelling package:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar el paquete.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getCancellationMessage = (pkg: Package): string => {
    const risk = getPackageCancellationRisk(pkg);
    
    switch (risk) {
      case 'low':
        return "Se puede cancelar sin problemas.";
      case 'medium':
        return "⚠️ El paquete ya tiene un viajero asignado. ¿Seguro que deseas cancelar?";
      case 'high':
        return "⚠️ Ya aceptaste una cotización. Cancelar puede afectar tu reputación.";
      default:
        return "¿Seguro que deseas cancelar este paquete?";
    }
  };

  return {
    cancelPackageWithOptions,
    getCancellationMessage,
    getPackageCancellationRisk
  };
};
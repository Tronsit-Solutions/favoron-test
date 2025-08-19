import { useState } from 'react';
import { Package } from '@/types';
import { useEnhancedPackageActions } from '@/hooks/useEnhancedPackageActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";

interface PackageCancelModalProps {
  pkg: Package | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePackage: (id: string, updates: any) => Promise<any>;
}

const PackageCancelModal = ({
  pkg,
  userId,
  isOpen,
  onClose,
  onUpdatePackage
}: PackageCancelModalProps) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { cancelPackageWithOptions, getCancellationMessage, getPackageCancellationRisk } = useEnhancedPackageActions();

  const handleCancel = async () => {
    if (!pkg) return;
    
    setIsLoading(true);
    const success = await cancelPackageWithOptions(pkg, userId, onUpdatePackage, {
      reason: reason.trim() || undefined
    });
    
    if (success) {
      setReason('');
      onClose();
    }
    setIsLoading(false);
  };

  if (!pkg) return null;

  const risk = getPackageCancellationRisk(pkg);
  const message = getCancellationMessage(pkg);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <span>Cancelar Paquete</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="text-sm">
              <strong>Paquete:</strong> {pkg.item_description}
            </div>
            
            <div className={`flex items-start space-x-2 p-3 rounded-md ${
              risk === 'high' ? 'bg-destructive/10' : 
              risk === 'medium' ? 'bg-warning/10' : 'bg-muted'
            }`}>
              {risk !== 'low' && <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />}
              <span className="text-sm">{message}</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="reason">Motivo de cancelación (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="¿Por qué deseas cancelar este paquete?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            No cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Cancelando...' : 'Sí, cancelar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PackageCancelModal;
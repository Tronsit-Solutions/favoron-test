import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Package as PackageIcon, Info, Ban } from "lucide-react";
import { ProductConfirmationItem } from "./ProductConfirmationItem";
import { ProductData } from "@/types";

interface ProductReceiptConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
  products: ProductData[];
  onConfirmProduct: (productIndex: number, photo: string) => Promise<void>;
}

export const ProductReceiptConfirmation = ({
  isOpen,
  onClose,
  packageId,
  packageName,
  products,
  onConfirmProduct
}: ProductReceiptConfirmationProps) => {
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  // Map products with their original indices FIRST, then filter - preserves indices after React re-renders
  const activeProductsWithIndex = products
    .map((product, originalIndex) => ({ product, originalIndex }))
    .filter(({ product }) => !product.cancelled);
  
  const cancelledCount = products.length - activeProductsWithIndex.length;

  const confirmedCount = activeProductsWithIndex.filter(({ product }) => product.receivedByTraveler).length;
  const totalCount = activeProductsWithIndex.length;
  const allConfirmed = confirmedCount === totalCount && totalCount > 0;
  const progressPercentage = totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0;

  const handleConfirmProduct = async (productIndex: number, photo: string) => {
    setConfirmingIndex(productIndex);
    try {
      await onConfirmProduct(productIndex, photo);
    } finally {
      setConfirmingIndex(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-primary" />
            Confirmación de Productos
          </DialogTitle>
          <DialogDescription>
            {cancelledCount > 0 
              ? `${packageName} (${cancelledCount} producto${cancelledCount > 1 ? 's' : ''} cancelado${cancelledCount > 1 ? 's' : ''})`
              : packageName
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cancelled products info */}
          {cancelledCount > 0 && (
            <Alert className="bg-muted/50 border-muted">
              <Ban className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-muted-foreground">
                {cancelledCount} producto{cancelledCount > 1 ? 's' : ''} cancelado{cancelledCount > 1 ? 's' : ''} no requiere{cancelledCount > 1 ? 'n' : ''} confirmación.
              </AlertDescription>
            </Alert>
          )}

          {/* Progress section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {allConfirmed ? (
                  <span className="text-green-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    ¡Todos los productos confirmados!
                  </span>
                ) : (
                  <span>Progreso de confirmación</span>
                )}
              </span>
              <span className={`font-semibold ${allConfirmed ? 'text-green-600' : 'text-muted-foreground'}`}>
                {confirmedCount} de {totalCount}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Info alert */}
          {!allConfirmed && totalCount > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Confirma cada producto individualmente con una foto. Una vez confirmados todos, el paquete cambiará a "Recibido por viajero".
              </AlertDescription>
            </Alert>
          )}

          {/* Success alert */}
          {allConfirmed && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Has confirmado todos los productos. Ahora puedes proceder a entregarlos en la oficina de Favorón.
              </AlertDescription>
            </Alert>
          )}

          {/* Products list - only active (non-cancelled) products with preserved indices */}
          <div className="space-y-3">
            {activeProductsWithIndex.map(({ product, originalIndex }) => (
              <ProductConfirmationItem
                key={originalIndex}
                product={product}
                index={originalIndex}
                packageId={packageId}
                onConfirm={handleConfirmProduct}
                isConfirming={confirmingIndex === originalIndex}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

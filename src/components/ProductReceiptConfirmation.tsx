import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Package as PackageIcon, Info } from "lucide-react";
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

  const confirmedCount = products.filter(p => p.receivedByTraveler).length;
  const totalCount = products.length;
  const allConfirmed = confirmedCount === totalCount;
  const progressPercentage = (confirmedCount / totalCount) * 100;

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
            {packageName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
          {!allConfirmed && (
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

          {/* Products list */}
          <div className="space-y-3">
            {products.map((product, index) => (
              <ProductConfirmationItem
                key={index}
                product={product}
                index={index}
                onConfirm={handleConfirmProduct}
                isConfirming={confirmingIndex === index}
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

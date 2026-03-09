import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductData {
  description: string;
  price: number;
  link?: string;
  receivedByTraveler?: boolean;
  receivedDate?: string;
  receivedPhoto?: string;
  weight?: number;
  declaredValue?: number;
}

interface ProductStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductData[];
  packageId: string;
  itemDescription: string;
}

export const ProductStatusModal = ({
  isOpen,
  onClose,
  products,
  packageId,
  itemDescription,
}: ProductStatusModalProps) => {
  const confirmedCount = products.filter(p => p.receivedByTraveler).length;
  const totalCount = products.length;
  const progressPercentage = (confirmedCount / totalCount) * 100;
  
  // Parse product names from item_description (comma separated)
  // Remove any prefix text before the actual product names (e.g., "Pedido de 2 productos: ")
  const productNames = itemDescription
    .split(':')  // Split by colon if present
    .pop()       // Take the last part (after the colon)
    ?.split(',') // Then split by commas
    .map(name => name.trim()) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Estado de Productos
          </DialogTitle>
          <DialogDescription>
            {confirmedCount} de {totalCount} productos confirmados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {confirmedCount === totalCount 
                ? "✅ Todos los productos confirmados" 
                : `${totalCount - confirmedCount} producto${totalCount - confirmedCount > 1 ? 's' : ''} pendiente${totalCount - confirmedCount > 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Products List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {products.map((product, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${
                  product.receivedByTraveler
                    ? "bg-green-50 border-green-200"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {product.receivedByTraveler ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-medium text-sm leading-tight">
                        {productNames[index] || `Producto #${index + 1}`}
                      </p>
                    </div>

                    {/* Status Description */}
                    <p className={`text-xs ${product.receivedByTraveler ? 'text-green-700 font-medium' : 'text-muted-foreground'}`}>
                      {product.receivedByTraveler 
                        ? "✓ El viajero confirmó que recibió este producto" 
                        : "El viajero aún no ha confirmado la recepción de este producto"}
                    </p>

                    {/* Confirmation Details */}
                    {product.receivedByTraveler && product.receivedDate && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          📅 Confirmado el{" "}
                          {format(new Date(product.receivedDate), "d 'de' MMMM", {
                            locale: es,
                          })}
                        </p>
                        {product.receivedPhoto && (
                          <ProductPhotoLink photoRef={product.receivedPhoto} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

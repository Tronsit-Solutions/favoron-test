import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatCurrency, formatDollarPrice } from "@/lib/formatters";

interface Product {
  itemDescription: string;
  estimatedPrice: string;
  quantity?: string;
  itemLink?: string;
  adminAssignedTip?: number;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  packageDescription: string;
}

const ProductDetailModal = ({ isOpen, onClose, products, packageDescription }: ProductDetailModalProps) => {
  const calculateTotal = () => {
    return products.reduce((sum, product) => {
      const price = parseFloat(product.estimatedPrice || '0');
      const qty = parseInt(product.quantity || '1');
      return sum + (price * qty);
    }, 0);
  };

  const totalItems = products.reduce((sum, product) => {
    return sum + parseInt(product.quantity || '1');
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Productos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Descripción del Paquete:</h3>
            <p className="text-sm">{packageDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total de productos:</span> {products.length}
            </div>
            <div>
              <span className="font-medium">Total de items:</span> {totalItems}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Valor total estimado:</span> {formatDollarPrice(calculateTotal())}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Productos:</h3>
            {products.map((product, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{product.itemDescription}</h4>
                  <Badge variant="outline" className="text-xs">
                    Producto {index + 1}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Precio unitario:</span> {formatDollarPrice(parseFloat(product.estimatedPrice || '0'))}
                  </div>
                  <div>
                    <span className="font-medium">Cantidad:</span> {product.quantity || '1'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Subtotal:</span> {formatDollarPrice(parseFloat(product.estimatedPrice || '0') * parseInt(product.quantity || '1'))}
                  </div>
                  {product.adminAssignedTip && (
                    <div className="col-span-2">
                      <span className="font-medium">Tip asignado:</span> {formatCurrency(product.adminAssignedTip)}
                    </div>
                  )}
                </div>

                {product.itemLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(product.itemLink, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver producto en línea
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
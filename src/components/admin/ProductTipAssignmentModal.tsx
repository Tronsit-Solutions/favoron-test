import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  itemDescription: string;
  estimatedPrice: string;
  itemLink?: string;
  quantity: string;
  adminAssignedTip?: number;
}

interface ProductTipAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productsWithTips: Product[], totalTip: number) => void;
  products: Product[];
  packageId: string;
}

const ProductTipAssignmentModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  products: initialProducts,
  packageId 
}: ProductTipAssignmentModalProps) => {
  const [products, setProducts] = useState<Product[]>(
    initialProducts.map(p => ({
      ...p,
      adminAssignedTip: p.adminAssignedTip || 0
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateProductTip = (index: number, tip: number) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, adminAssignedTip: tip } : product
    ));
  };

  const calculateTotalTip = () => {
    return products.reduce((total, product) => total + (product.adminAssignedTip || 0), 0);
  };

  const distributeEqually = () => {
    const totalTip = calculateTotalTip();
    const equalTip = totalTip / products.length;
    setProducts(prev => prev.map(product => ({
      ...product,
      adminAssignedTip: parseFloat(equalTip.toFixed(2))
    })));
  };

  const handleSave = async () => {
    // Validate that all products have tips assigned
    const hasUnassignedTips = products.some(p => !p.adminAssignedTip || p.adminAssignedTip <= 0);
    if (hasUnassignedTips) {
      toast({
        title: "Error",
        description: "Todos los productos deben tener un tip asignado mayor a 0",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const totalTip = calculateTotalTip();
      await onSave(products, totalTip);
      onClose();
    } catch (error) {
      console.error('Error saving tips:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los tips",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Asignar Tips por Producto - #{packageId.slice(0, 8)}</span>
          </DialogTitle>
          <DialogDescription>
            Asigna un tip individual para cada producto en este pedido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pedido de {products.length} producto{products.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-lg font-medium">
                    Valor total estimado: ${products.reduce((sum, p) => {
                      const price = parseFloat(p.estimatedPrice || '0');
                      const quantity = parseInt(p.quantity || '1');
                      return sum + (price * quantity);
                    }, 0).toFixed(2)}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Tip total: Q{calculateTotalTip().toFixed(2)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Product Tips Assignment */}
          <div className="space-y-3">
            {products.map((product, index) => {
              const productValue = parseFloat(product.estimatedPrice || '0') * parseInt(product.quantity || '1');
              
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                      {/* Product Info */}
                      <div className="lg:col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Producto #{index + 1}</h4>
                          <Badge variant="secondary">${productValue.toFixed(2)}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {product.itemDescription}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Precio: ${product.estimatedPrice}</span>
                          <span>Cantidad: {product.quantity}</span>
                          {product.itemLink && (
                            <a 
                              href={product.itemLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Ver</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Tip Assignment */}
                      <div className="space-y-2">
                        <Label htmlFor={`tip-${index}`} className="text-sm font-medium">
                          Tip (Q)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">Q</span>
                          <Input
                            id={`tip-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={product.adminAssignedTip || ''}
                            onChange={(e) => updateProductTip(index, parseFloat(e.target.value) || 0)}
                            className="pl-8"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {product.adminAssignedTip && productValue > 0 
                            ? `${((product.adminAssignedTip / productValue) * 100).toFixed(1)}% del valor`
                            : 'Asigna un tip para este producto'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={distributeEqually}
              disabled={calculateTotalTip() === 0}
            >
              Distribuir equitativamente
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const suggestedTip = 50; // Q50 per product
                setProducts(prev => prev.map(product => ({
                  ...product,
                  adminAssignedTip: suggestedTip
                })));
              }}
            >
              Q50 por producto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setProducts(prev => prev.map(product => {
                  const productValue = parseFloat(product.estimatedPrice || '0') * parseInt(product.quantity || '1');
                  return {
                    ...product,
                    adminAssignedTip: parseFloat((productValue * 0.15).toFixed(2)) // 15% of product value
                  };
                }));
              }}
            >
              15% del valor
            </Button>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || calculateTotalTip() === 0}
              className="flex-1"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Asignar Tips (Q{calculateTotalTip().toFixed(2)})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductTipAssignmentModal;
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
  console.log('🔍 DEBUG ProductTipAssignmentModal - initialProducts:', initialProducts);
  console.log('🔍 DEBUG ProductTipAssignmentModal - packageId:', packageId);
  
  const [products, setProducts] = useState<Product[]>(
    initialProducts.map(p => {
      console.log('🔍 DEBUG Mapping product:', p);
      return {
        ...p,
        adminAssignedTip: p.adminAssignedTip || 0
      };
    })
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

        <div className="space-y-6">
          {/* Summary */}
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Resumen del Pedido
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {products.length} producto{products.length !== 1 ? 's' : ''} en total
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    Valor total estimado: ${products.reduce((sum, p) => {
                      const price = parseFloat(p.estimatedPrice || '0');
                      const quantity = parseInt(p.quantity || '1');
                      return sum + (price * quantity);
                    }, 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Tip total asignado</p>
                  <Badge variant="outline" className="text-xl px-4 py-2 font-bold">
                    Q{calculateTotalTip().toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Product Tip Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Asignación de Tips por Producto
            </h3>
            
            {/* Debug info for products */}
            {products.length === 0 && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground">
                  ⚠️ No se encontraron productos para mostrar
                </p>
              </div>
            )}
            
            {products.map((product, index) => {
              const productValue = parseFloat(product.estimatedPrice || '0') * parseInt(product.quantity || '1');
              
              return (
                <Card key={index} className="border border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Complete Product Information */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Producto #{index + 1}
                          </h4>
                          <Badge variant="secondary" className="text-base px-3 py-1">
                            Valor: ${productValue.toFixed(2)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                           <div>
                             <Label className="text-sm font-medium text-muted-foreground">
                               Descripción del producto
                             </Label>
                             <p className="text-sm text-foreground mt-1 p-3 bg-muted rounded-md">
                               {product.itemDescription || 'Sin descripción disponible'}
                             </p>
                           </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <Label className="text-sm font-medium text-muted-foreground">
                                 Precio unitario
                               </Label>
                               <p className="text-lg font-semibold text-foreground">
                                 ${product.estimatedPrice || '0.00'}
                               </p>
                            </div>
                            <div>
                               <Label className="text-sm font-medium text-muted-foreground">
                                 Cantidad
                               </Label>
                               <p className="text-lg font-semibold text-foreground">
                                 {product.quantity || '1'} unidad{parseInt(product.quantity || '1') !== 1 ? 'es' : ''}
                               </p>
                            </div>
                          </div>
                          
                          {product.itemLink && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">
                                Enlace del producto
                              </Label>
                              <a 
                                href={product.itemLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-primary hover:underline mt-1 p-2 bg-muted rounded-md text-sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                                <span>Ver producto en línea</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tip Assignment Section */}
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <h5 className="text-lg font-semibold text-foreground mb-2">
                            Asignar Tip Individual
                          </h5>
                          <p className="text-sm text-muted-foreground mb-4">
                            Ingresa el tip específico para este producto
                          </p>
                          
                          <div className="space-y-3">
                            <Label htmlFor={`tip-${index}`} className="text-base font-medium text-foreground">
                              Tip en Quetzales (Q)
                            </Label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground text-lg font-medium">
                                Q
                              </span>
                              <Input
                                id={`tip-${index}`}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={product.adminAssignedTip || ''}
                                onChange={(e) => updateProductTip(index, parseFloat(e.target.value) || 0)}
                                className="pl-10 text-lg font-semibold h-12 text-center"
                              />
                            </div>
                            
                            {product.adminAssignedTip && productValue > 0 ? (
                              <div className="p-3 bg-success/10 rounded-md">
                                <p className="text-sm font-medium text-success">
                                  ✓ Tip asignado: {((product.adminAssignedTip / productValue) * 100).toFixed(1)}% del valor del producto
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm text-muted-foreground">
                                  💡 Ingresa un tip para continuar
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
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
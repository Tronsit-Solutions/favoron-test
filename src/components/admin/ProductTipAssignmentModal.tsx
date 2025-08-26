
import { useState, useEffect } from "react";
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
  
  const [products, setProducts] = useState<Product[]>([]);
  
  // Update products when initialProducts changes
  useEffect(() => {
    console.log('🔍 DEBUG Setting products from initialProducts:', initialProducts);
    const mappedProducts = initialProducts.map(p => {
      console.log('🔍 DEBUG Mapping product:', p);
      return {
        ...p,
        adminAssignedTip: p.adminAssignedTip || 0
      };
    });
    setProducts(mappedProducts);
  }, [initialProducts]);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Tips #{packageId.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Compact Summary */}
          <Card className="border border-primary/20">
            <CardContent className="p-3">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-muted-foreground">{products.length} productos</span>
                  <p className="font-semibold">${products.reduce((sum, p) => {
                    const price = parseFloat(p.estimatedPrice || '0') || 0;
                    const quantity = parseInt(p.quantity || '1') || 1;
                    return sum + (price * quantity);
                  }, 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Tip total</span>
                  <Badge variant="outline" className="text-sm font-bold ml-2">
                    Q{calculateTotalTip().toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Products */}
          {products.length === 0 && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground">⚠️ No hay productos</p>
            </div>
          )}
          
          {products.map((product, index) => {
            const price = parseFloat(product.estimatedPrice || '0') || 0;
            const quantity = parseInt(product.quantity || '1') || 1;
            const productValue = price * quantity;
            
            return (
              <Card key={index} className="border border-border/50 bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left Side - Product Information */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                      </div>
                      
                      <p className="text-sm font-medium leading-tight">
                        {product.itemDescription || 'Sin descripción'}
                      </p>
                      
                      {product.itemLink && (
                        <div className="pt-1">
                          <a 
                            href={product.itemLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver producto en tienda
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span>${price.toFixed(2)}</span>
                        <span>×</span>
                        <span>{quantity}</span>
                        <span>=</span>
                        <span className="font-semibold text-foreground">${productValue.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Right Side - Tip Assignment */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <div className="flex-1">
                        <Label htmlFor={`tip-${index}`} className="text-xs text-muted-foreground">
                          Tip
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">Q</span>
                          <Input
                            id={`tip-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.adminAssignedTip || ''}
                            onChange={(e) => updateProductTip(index, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="h-8 text-xs pl-6 font-mono"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateProductTip(index, productValue * 0.1)}
                          className="h-8 px-2 text-xs"
                        >
                          10%
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateProductTip(index, productValue * 0.15)}
                          className="h-8 px-2 text-xs"
                        >
                          15%
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  {product.adminAssignedTip && productValue > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <div className="text-xs text-muted-foreground flex justify-between items-center">
                        <span>Tip asignado:</span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          Q{product.adminAssignedTip.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Compact Actions */}
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={distributeEqually}
              disabled={calculateTotalTip() === 0}
              className="h-7 px-2 text-xs"
            >
              Distribuir igual
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setProducts(prev => prev.map(product => ({
                  ...product,
                  adminAssignedTip: 50
                })));
              }}
              className="h-7 px-2 text-xs"
            >
              Q50 c/u
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setProducts(prev => prev.map(product => {
                  const price = parseFloat(product.estimatedPrice || '0') || 0;
                  const quantity = parseInt(product.quantity || '1') || 1;
                  const productValue = price * quantity;
                  return {
                    ...product,
                    adminAssignedTip: parseFloat((productValue * 0.15).toFixed(2))
                  };
                }));
              }}
              className="h-7 px-2 text-xs"
            >
              15% valor
            </Button>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || calculateTotalTip() === 0}
              className="flex-1 h-8 text-xs"
            >
              {isLoading ? 'Guardando...' : `Asignar Q${calculateTotalTip().toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductTipAssignmentModal;

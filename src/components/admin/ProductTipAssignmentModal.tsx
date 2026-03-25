import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, DollarSign, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeProductUrl } from "@/lib/validators";
import { useAdminTips } from "@/hooks/useAdminTips";

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
  tripId?: string | null;
  travelerId?: string | null;
  trustLevel?: string;
  persistOnSave?: boolean;
}

const ProductTipAssignmentModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  products: initialProducts,
  packageId,
  tripId,
  travelerId,
  trustLevel,
  persistOnSave = true
}: ProductTipAssignmentModalProps) => {
  console.log('🔍 DEBUG ProductTipAssignmentModal - initialProducts:', initialProducts);
  console.log('🔍 DEBUG ProductTipAssignmentModal - packageId:', packageId);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [tipValues, setTipValues] = useState<string[]>([]);
  
  // Re-initialize when packageId changes
  useEffect(() => {
    setProducts([]);
    setTipValues([]);
    
    if (initialProducts.length === 0) return;
    
    const mappedProducts = initialProducts.map(p => ({
      ...p,
      adminAssignedTip: p.adminAssignedTip || 0,
      additionalNotes: (p as any).additionalNotes || null
    }));
    setProducts(mappedProducts);
    
    const initialTipValues = mappedProducts.map(p => 
      p.adminAssignedTip && p.adminAssignedTip > 0 ? p.adminAssignedTip.toString() : ''
    );
    setTipValues(initialTipValues);
  }, [packageId]);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { saveProductTips } = useAdminTips();

  const calculateTotalTip = () => {
    return tipValues.reduce((total, tip) => total + (parseFloat(tip) || 0), 0);
  };

  const updateTipValue = (index: number, value: string) => {
    // Clean the input: remove leading zeros and ensure valid decimal format
    let cleanValue = value;
    if (cleanValue && !isNaN(Number(cleanValue))) {
      // Remove leading zeros but keep decimal places
      cleanValue = parseFloat(cleanValue).toString();
      // If it's a whole number and user is still typing, keep the raw input
      if (value.includes('.') && !cleanValue.includes('.')) {
        cleanValue = value;
      }
    }
    
    setTipValues(prev => {
      const newTipValues = [...prev];
      newTipValues[index] = cleanValue;
      return newTipValues;
    });
  };

  const distributeEqually = () => {
    const totalTip = calculateTotalTip();
    const equalTip = totalTip / products.length;
    const tipValue = parseFloat(equalTip.toFixed(2));
    
    // Update all tip values
    setTipValues(new Array(products.length).fill(tipValue.toString()));
  };

  const handleSave = async () => {
    // Validate that all products have tips assigned
    const hasUnassignedTips = tipValues.some(tip => (parseFloat(tip) || 0) <= 0);
    if (hasUnassignedTips) {
      toast({
        title: "Error",
        description: "Todos los productos deben tener un tip asignado mayor a 0",
        variant: "destructive"
      });
      return;
    }

    // Create products with current tip values
    const productsWithTips = products.map((product, index) => ({
      ...product,
      adminAssignedTip: parseFloat(tipValues[index]) || 0
    }));
    const totalTip = calculateTotalTip();

    // Draft mode: skip DB, just pass data back
    if (!persistOnSave) {
      if (onSave) {
        await onSave(productsWithTips, totalTip);
      }
      onClose();
      return;
    }

    // Persist mode: save to DB
    setIsLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('La operación tardó demasiado. Intenta de nuevo.')), 15000)
      );

      await Promise.race([
        saveProductTips(
          packageId, 
          productsWithTips.map(p => ({
            itemDescription: p.itemDescription,
            estimatedPrice: p.estimatedPrice,
            itemLink: p.itemLink,
            quantity: p.quantity,
            adminAssignedTip: p.adminAssignedTip || 0,
            additionalNotes: (p as any).additionalNotes || null,
          })),
          { tripId, travelerId, trustLevel }
        ),
        timeoutPromise
      ]);

      if (onSave) {
        await onSave(productsWithTips, totalTip);
      }

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
      <DialogContent className="max-w-2xl md:max-w-2xl max-w-full max-h-[90vh] overflow-y-auto mobile-safe-form">
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
                   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                     {/* Product Information */}
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
                             href={normalizeProductUrl(product.itemLink) || product.itemLink} 
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
                     
                     {/* Tip Assignment */}
                     <div className="flex flex-col md:flex-row md:items-center gap-3 md:min-w-[200px]">
                       <div className="flex-1">
                         <Label htmlFor={`tip-${index}`} className="text-xs text-muted-foreground">
                           Tip
                         </Label>
                         <div className="relative">
                           <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">Q</span>
                            <Input
                             key={`tip-input-${index}`}
                             id={`tip-${index}`}
                             type="number"
                             inputMode="decimal"
                             min="0"
                             step="0.01"
                             value={tipValues[index] || ''}
                             onChange={(e) => updateTipValue(index, e.target.value)}
                             placeholder="0.00"
                             className="h-10 md:h-8 text-base md:text-xs pl-8 md:pl-6 font-mono min-h-[44px] md:min-h-[32px]"
                           />
                         </div>
                       </div>
                       
                       <div className="flex gap-2 md:gap-1">
                          <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const tip = parseFloat((productValue * 0.1).toFixed(2));
                             updateTipValue(index, tip.toString());
                           }}
                           className="h-10 md:h-8 px-3 md:px-2 text-sm md:text-xs min-h-[44px] md:min-h-[32px] flex-1 md:flex-none"
                         >
                           10%
                         </Button>
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             const tip = parseFloat((productValue * 0.15).toFixed(2));
                             updateTipValue(index, tip.toString());
                           }}
                           className="h-10 md:h-8 px-3 md:px-2 text-sm md:text-xs min-h-[44px] md:min-h-[32px] flex-1 md:flex-none"
                         >
                           15%
                         </Button>
                       </div>
                     </div>
                   </div>
                  
                  {/* Status indicator */}
                  {tipValues[index] && parseFloat(tipValues[index]) > 0 && productValue > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <div className="text-xs text-muted-foreground flex justify-between items-center">
                        <span>Tip asignado:</span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          Q{(parseFloat(tipValues[index]) || 0).toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

           {/* Quick Actions */}
           <div className="grid grid-cols-1 md:flex md:flex-wrap gap-2 md:gap-1">
             <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={distributeEqually}
               disabled={calculateTotalTip() === 0}
               className="h-10 md:h-7 px-3 md:px-2 text-sm md:text-xs min-h-[44px] md:min-h-[28px]"
             >
               Distribuir igual
             </Button>
             <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={() => {
                 setTipValues(new Array(products.length).fill('50'));
               }}
               className="h-10 md:h-7 px-3 md:px-2 text-sm md:text-xs min-h-[44px] md:min-h-[28px]"
             >
               Q50 c/u
             </Button>
             <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={() => {
                 const newTipValues = products.map((product) => {
                   const price = parseFloat(product.estimatedPrice || '0') || 0;
                   const quantity = parseInt(product.quantity || '1') || 1;
                   const productValue = price * quantity;
                   return (productValue * 0.15).toFixed(2);
                 });
                 setTipValues(newTipValues);
               }}
               className="h-10 md:h-7 px-3 md:px-2 text-sm md:text-xs min-h-[44px] md:min-h-[28px]"
             >
               15% valor
             </Button>
           </div>

           {/* Footer Actions - Sticky on mobile */}
           <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm md:static md:bg-transparent md:backdrop-blur-none md:pt-2">
             <Button 
               type="button" 
               variant="outline" 
               onClick={onClose} 
               className="flex-1 h-12 md:h-8 text-base md:text-xs min-h-[48px] md:min-h-[32px]"
               disabled={isLoading}
             >
               Cancelar
             </Button>
             <Button 
               onClick={handleSave} 
               disabled={isLoading || calculateTotalTip() === 0}
               className="flex-1 h-12 md:h-8 text-base md:text-xs min-h-[48px] md:min-h-[32px]"
             >
               {isLoading ? 'Guardando...' : persistOnSave ? 'Guardar Tips' : 'Aplicar Tips'}
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductTipAssignmentModal;

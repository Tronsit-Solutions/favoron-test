import { useState } from 'react';
import { Package } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PackageProductDisplay from "./PackageProductDisplay";
import ProductCancellationModal from "./ProductCancellationModal";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { canCancelProduct } from "@/lib/refundCalculations";
import { formatCurrency } from "@/lib/formatters";
import { X, AlertTriangle, Ban } from "lucide-react";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: Package;
  onProductCancelled?: () => void;
}

const ProductDetailsModal = ({ isOpen, onClose, pkg, onProductCancelled }: ProductDetailsModalProps) => {
  const [cancellationModal, setCancellationModal] = useState<{
    isOpen: boolean;
    product: any;
    productIndex: number;
  } | null>(null);

  // Get product count for display
  const getProductCount = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data)) {
      return pkg.products_data.length;
    }
    return 1; // Single product (old format)
  };

  const productCount = getProductCount();
  const products = Array.isArray(pkg.products_data) ? pkg.products_data : [];
  
  // Count active (non-cancelled) products
  const activeProducts = products.filter((p: any) => !p.cancelled);
  const activeProductCount = activeProducts.length;
  
  // Count cancelled products
  const cancelledProducts = products.filter((p: any) => p.cancelled);
  const totalRefunded = cancelledProducts.reduce((sum: number, p: any) => sum + (p.refundAmount || 0), 0);
  
  // Check if it's a personal order
  const isPersonalOrder = pkg.products_data && Array.isArray(pkg.products_data) && 
    pkg.products_data.some((p: any) => p.requestType === 'personal');

  // Component to render product photos
  const ProductPhotos = ({ photos }: { photos: any[] }) => {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Fotos del producto:</p>
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, idx) => {
            const PhotoItem = () => {
              const { url, loading } = useSignedUrl(`${photo.bucket}/${photo.filePath}`);
              return (
                <div className="relative aspect-square rounded-md overflow-hidden border border-border">
                  {loading ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <p className="text-xs text-muted-foreground">Cargando...</p>
                    </div>
                  ) : (
                    <img 
                      src={url || photo.previewUrl} 
                      alt={`Producto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              );
            };
            return <PhotoItem key={idx} />;
          })}
        </div>
      </div>
    );
  };

  const handleCancelProduct = (product: any, index: number) => {
    setCancellationModal({
      isOpen: true,
      product,
      productIndex: index
    });
  };

  const handleCancellationComplete = () => {
    setCancellationModal(null);
    onProductCancelled?.();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Detalles del pedido ({productCount} producto{productCount !== 1 ? 's' : ''})</span>
              {isPersonalOrder && (
                <Badge variant="secondary" className="ml-2">
                  Pedido Personal
                </Badge>
              )}
          </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT', { 
                day: 'numeric', month: 'long', year: 'numeric' 
              })}
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Cancelled products summary */}
            {cancelledProducts.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <Ban className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    {cancelledProducts.length} producto{cancelledProducts.length !== 1 ? 's' : ''} cancelado{cancelledProducts.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs">• Reembolso: {formatCurrency(totalRefunded)}</span>
                </div>
              </div>
            )}

            {/* Show products data */}
            {Array.isArray(pkg.products_data) && pkg.products_data.map((product: any, idx: number) => {
              const { canCancel, reason } = canCancelProduct(product, pkg.status, activeProductCount);
              const isCancelled = product.cancelled;

              return (
                <div 
                  key={idx} 
                  className={`relative border rounded-lg p-4 space-y-3 ${
                    isCancelled 
                      ? 'bg-muted/70 border-muted-foreground/20 opacity-60' 
                      : ''
                  }`}
                >
                  {/* Cancelled overlay */}
                  {isCancelled && (
                    <div className="absolute inset-0 bg-muted/20 rounded-lg pointer-events-none flex items-center justify-center overflow-hidden">
                      <span className="text-muted-foreground/30 font-bold text-2xl rotate-[-15deg] select-none">
                        CANCELADO
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
                        Producto {idx + 1}
                      </h3>
                      <Badge variant={product.requestType === 'personal' ? 'secondary' : 'outline'}>
                        {product.requestType === 'personal' ? 'Personal' : 'Online'}
                      </Badge>
                      {isCancelled && (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border border-destructive/30">
                          <Ban className="h-3 w-3 mr-1" />
                          Cancelado
                        </Badge>
                      )}
                    </div>
                    
                    {/* Cancel button */}
                    {!isCancelled && canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancelProduct(product, idx)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>

                  {/* Cancelled info */}
                  {isCancelled && (
                    <div className="bg-destructive/10 p-2 rounded text-sm">
                      <p className="text-destructive font-medium">
                        Reembolso: {formatCurrency(product.refundAmount || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cancelado el {new Date(product.cancelledAt).toLocaleDateString('es-GT')}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Descripción:</strong> {product.itemDescription}
                    </p>
                    
                    {product.requestType === 'personal' ? (
                      <>
                        {product.instructions && (
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium mb-1">Instrucciones:</p>
                            <p className="text-sm">{product.instructions}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          {product.weight && (
                            <p className="text-sm">
                              <strong>Peso:</strong> {product.weight} kg
                            </p>
                          )}
                          <p className="text-sm">
                            <strong>Valor declarado:</strong> ${product.estimatedPrice || product.declaredValue}
                          </p>
                        </div>
                        
                        {product.itemLink && (
                          <p className="text-sm">
                            <strong>Link de referencia:</strong>{' '}
                            <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Ver link
                            </a>
                          </p>
                        )}
                        
                        {product.productPhotos && product.productPhotos.length > 0 && (
                          <ProductPhotos photos={product.productPhotos} />
                        )}
                      </>
                    ) : (
                      <>
                        {product.itemLink && (
                          <p className="text-sm">
                            <strong>Link:</strong>{' '}
                            <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Ver producto
                            </a>
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <p className="text-sm">
                            <strong>Precio:</strong> ${product.estimatedPrice}
                          </p>
                          <p className="text-sm">
                            <strong>Cantidad:</strong> {product.quantity || 1}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Fallback for old format */}
            {!Array.isArray(pkg.products_data) && (
              <PackageProductDisplay
                products={undefined}
                itemDescription={pkg.item_description}
                itemLink={pkg.item_link}
                estimatedPrice={pkg.estimated_price?.toString()}
              />
            )}
            
            {pkg.additional_notes && (
              <div className="border-t pt-4">
                <p className="text-sm">
                  <strong>Notas adicionales:</strong> {pkg.additional_notes}
                </p>
              </div>
            )}

            {/* Adjusted total if there are cancellations */}
            {cancelledProducts.length > 0 && pkg.quote && (
              <>
                <Separator />
                <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total original:</span>
                    <span className="line-through">{formatCurrency((pkg.quote as any).totalPrice || 0)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Reembolsos:</span>
                    <span>-{formatCurrency(totalRefunded)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total ajustado:</span>
                    <span>{formatCurrency((pkg.quote as any).adjustedTotalPrice || ((pkg.quote as any).totalPrice || 0) - totalRefunded)}</span>
                  </div>
                </div>
              </>
            )}
            
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Creado el {new Date(pkg.created_at).toLocaleDateString('es-GT')}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Modal */}
      {cancellationModal && (
        <ProductCancellationModal
          isOpen={cancellationModal.isOpen}
          onClose={() => setCancellationModal(null)}
          product={cancellationModal.product}
          productIndex={cancellationModal.productIndex}
          packageId={pkg.id}
          quote={pkg.quote || {}}
          allProducts={products as any[]}
          onCancellationComplete={handleCancellationComplete}
        />
      )}
    </>
  );
};

export default ProductDetailsModal;

import { Package } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PackageProductDisplay from "./PackageProductDisplay";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: Package;
}

const ProductDetailsModal = ({ isOpen, onClose, pkg }: ProductDetailsModalProps) => {
  // Get product count for display
  const getProductCount = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data)) {
      return pkg.products_data.length;
    }
    return 1; // Single product (old format)
  };

  const productCount = getProductCount();
  
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

  return (
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
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Show products data */}
          {Array.isArray(pkg.products_data) && pkg.products_data.map((product: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Producto {idx + 1}</h3>
                <Badge variant={product.requestType === 'personal' ? 'secondary' : 'outline'}>
                  {product.requestType === 'personal' ? 'Personal' : 'Online'}
                </Badge>
              </div>
              
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
          ))}
          
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
          
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Creado el {new Date(pkg.created_at).toLocaleDateString('es-GT')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
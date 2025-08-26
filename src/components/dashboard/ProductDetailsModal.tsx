import { Package } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PackageProductDisplay from "./PackageProductDisplay";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalles del pedido ({productCount} producto{productCount !== 1 ? 's' : ''})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <PackageProductDisplay
            products={Array.isArray(pkg.products_data) ? pkg.products_data as any[] : undefined}
            itemDescription={pkg.item_description}
            itemLink={pkg.item_link}
            estimatedPrice={pkg.estimated_price?.toString()}
          />
          
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
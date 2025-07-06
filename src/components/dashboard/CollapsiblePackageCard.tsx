
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Edit } from "lucide-react";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import PaymentUpload from "@/components/PaymentUpload";
import EditPackageModal from "@/components/EditPackageModal";
import ShopperPackagePriorityActions from "@/components/dashboard/shopper/ShopperPackagePriorityActions";
import ShopperPackageDetails from "@/components/dashboard/shopper/ShopperPackageDetails";
import ShopperPackageInfo from "@/components/dashboard/shopper/ShopperPackageInfo";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { usePackageActions } from "@/hooks/usePackageActions";
import { Package, UserType, DocumentType } from "@/types";

interface CollapsiblePackageCardProps {
  pkg: Package;
  packages: Package[];
  setPackages: (packages: Package[]) => void;
  onQuote: (pkg: Package, userType: UserType) => void;
  onConfirmAddress: (pkg: Package) => void;
  onEditPackage?: (packageData: Package) => void;
  viewMode?: 'shopper' | 'traveler';
}

const CollapsiblePackageCard = ({ 
  pkg, 
  packages,
  setPackages,
  onQuote, 
  onConfirmAddress,
  onEditPackage,
  viewMode = 'shopper'
}: CollapsiblePackageCardProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  
  const { getStatusBadge } = useStatusHelpers();
  const { handleUploadDocument } = usePackageActions(packages, setPackages);

  const handlePaymentUpload = (paymentData: any) => {
    handleUploadDocument(pkg.id, 'payment_receipt', paymentData);
  };

  // Removed individual render functions - now handled by dedicated components

  const renderActionButtons = () => {
    const canEdit = viewMode === 'shopper' && ['pending_approval', 'approved'].includes(pkg.status);
    
    return (
      <div className="flex flex-wrap gap-2">
        {viewMode === 'shopper' && canEdit && onEditPackage && (
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
        
        {viewMode === 'traveler' && pkg.status === 'matched' && (
          <Button 
            size="sm"
            onClick={() => onQuote(pkg, 'traveler')}
          >
            Enviar Cotización
          </Button>
        )}
      </div>
    );
  };

  const handleEditSubmit = (editedData: Package) => {
    if (onEditPackage) {
      onEditPackage(editedData);
    }
    setShowEditModal(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>
                    {pkg.products && pkg.products.length > 0 
                      ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                      : pkg.itemDescription
                    }
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
                <CardDescription>
                  {pkg.products && pkg.products.length > 0 
                    ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)} • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}`
                    : `Precio estimado: ${pkg.estimatedPrice} • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}`
                  }
                </CardDescription>
              </div>
              {getStatusBadge(pkg.status)}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {/* Priority Actions Section */}
            {viewMode === 'shopper' && (
              <ShopperPackagePriorityActions 
                pkg={pkg}
                onQuote={onQuote}
              />
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <ShopperPackageDetails pkg={pkg} />
                <ShopperPackageInfo pkg={pkg} />
                {renderActionButtons()}
              </div>

              <div className="space-y-4">
                <PackageStatusTimeline currentStatus={pkg.status} />
                
                {/* Show payment upload component after quote acceptance - PROMINENT */}
                {pkg.status === 'quote_accepted' && viewMode === 'shopper' && (
                  <div className="order-first md:order-none bg-info-muted border border-info-border rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-info">💳 Subir comprobante de pago</p>
                      <p className="text-xs text-info">Sube tu comprobante para que el viajero proceda con la compra.</p>
                    </div>
                    <PaymentUpload 
                      packageId={pkg.id}
                      onUpload={handlePaymentUpload}
                    />
                  </div>
                )}
                
                {/* Show upload documents after payment confirmation */}
                {pkg.status === 'payment_confirmed' && viewMode === 'shopper' && (
                  <div className="bg-warning-muted border border-warning-border rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-warning">📋 Subir documentos de compra</p>
                      <p className="text-xs text-warning">¿Ya compraste el producto? Sube el comprobante y tracking aquí.</p>
                    </div>
                    <UploadDocuments 
                      packageId={pkg.id}
                      currentStatus={pkg.status}
                      onUpload={(type, data) => handleUploadDocument(pkg.id, type as DocumentType, data)}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
      
      {/* Edit Modal */}
      <EditPackageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        packageData={pkg}
      />
    </Collapsible>
  );
};

export default React.memo(CollapsiblePackageCard);

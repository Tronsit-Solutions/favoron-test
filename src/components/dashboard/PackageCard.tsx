
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import PaymentUpload from "@/components/PaymentUpload";
import EditPackageModal from "@/components/EditPackageModal";
import OrderStepsFlow from "@/components/dashboard/OrderStepsFlow";
import PackageHeader from "@/components/dashboard/PackageHeader";
import PackageProductDisplay from "@/components/dashboard/PackageProductDisplay";
import PackageQuoteInfo from "@/components/dashboard/PackageQuoteInfo";
import PackageActionButtons from "@/components/dashboard/PackageActionButtons";

interface PackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'user') => void;
  onConfirmAddress: (pkg: any) => void;
  onUploadDocument: (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
  onEditPackage?: (packageData: any) => void;
  viewMode?: 'user';
}

const PackageCard = ({ 
  pkg, 
  getStatusBadge, 
  onQuote, 
  onConfirmAddress, 
  onUploadDocument,
  onEditPackage,
  viewMode = 'user'
}: PackageCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  
  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
    setShowPaymentUpload(false);
  };

  const handleEditSubmit = (editedData: any) => {
    if (onEditPackage) {
      onEditPackage(editedData);
    }
    setShowEditModal(false);
  };

  // Special layout for payment pending state
  if (pkg.status === 'quote_accepted' && viewMode === 'shopper') {
    return (
      <Card key={pkg.id} className="border-warning-border bg-warning-muted/30">
        <PackageHeader pkg={pkg} getStatusBadge={getStatusBadge} />
        <CardContent>
          {/* PAYMENT SECTION - PROMINENT AND VISIBLE */}
          <div className="mb-6">
            <PaymentUpload 
              packageId={pkg.id}
              onUpload={handlePaymentUpload}
              currentPaymentReceipt={pkg.paymentReceipt}
              isPaymentApproved={pkg.status === 'payment_confirmed' || pkg.status === 'in_transit' || pkg.status === 'delivered'}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <PackageProductDisplay 
                products={pkg.products}
                itemDescription={pkg.itemDescription}
                itemLink={pkg.itemLink}
                estimatedPrice={pkg.estimatedPrice}
              />
              
              <PackageQuoteInfo quote={pkg.quote} />
              
              <PackageActionButtons
                pkg={pkg}
                viewMode={viewMode}
                onQuote={onQuote}
                onEditClick={() => setShowEditModal(true)}
                onEditPackage={onEditPackage}
              />

              {pkg.additionalNotes && (
                <div className="text-sm">
                  <strong>Notas adicionales:</strong> {pkg.additionalNotes}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Creado el {new Date(pkg.createdAt).toLocaleDateString('es-GT')}
              </p>
            </div>

            <div className="space-y-4">
              <PackageStatusTimeline currentStatus={pkg.status} />
            </div>
          </div>
        </CardContent>
        
        <EditPackageModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          packageData={pkg}
        />
      </Card>
    );
  }

  return (
    <Card key={pkg.id}>
      <PackageHeader pkg={pkg} getStatusBadge={getStatusBadge} />
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <PackageProductDisplay 
              products={pkg.products}
              itemDescription={pkg.itemDescription}
              itemLink={pkg.itemLink}
              estimatedPrice={pkg.estimatedPrice}
            />
            
            <PackageQuoteInfo quote={pkg.quote} />

            <OrderStepsFlow 
              pkg={pkg}
              viewMode={viewMode}
              onUploadDocument={onUploadDocument}
            />

            <PackageActionButtons
              pkg={pkg}
              viewMode={viewMode}
              onQuote={onQuote}
              onEditClick={() => setShowEditModal(true)}
              onEditPackage={onEditPackage}
            />

            {pkg.additionalNotes && (
              <div className="text-sm">
                <strong>Notas adicionales:</strong> {pkg.additionalNotes}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Creado el {new Date(pkg.createdAt).toLocaleDateString('es-GT')}
            </p>
          </div>

          <div className="space-y-4">
            <PackageStatusTimeline currentStatus={pkg.status} />
          </div>
        </div>
      </CardContent>
      
      <EditPackageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        packageData={pkg}
      />
    </Card>
  );
};

export default PackageCard;
